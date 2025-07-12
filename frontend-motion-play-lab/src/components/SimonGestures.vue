<template>
  <div class="simon-game">
    <div id="webcam-container" ref="webcamContainer"></div>
    <div id="label-container" ref="labelContainer"></div>
    <div id="p5-container" ref="p5Container"></div>
    <button
      v-if="!gameStarted && modelLoaded"
      @click="startGame"
      class="start-button"
      :style="startButtonStyle"
    >
      ¡Iniciar!
    </button>
    <button v-if="gameOver" @click="restartGame" class="restart-button">¡REINICIAR!</button>
    <router-link to="/" class="back-button">MENÚ</router-link>
  </div>
</template>

<script>
import { ref, onMounted, onUnmounted } from 'vue'

export default {
  name: 'SimonGestures',
  setup() {
    const webcamContainer = ref(null)
    const labelContainer = ref(null)
    const p5Container = ref(null)

    const gameStarted = ref(false)
    const gameOver = ref(false)
    const modelLoaded = ref(false)
    const score = ref(0)

    let p5Instance = null
    let model = null
    let webcam = null
    let maxPredictions = 0
    let bgImgs = {}

    let sequence = []
    let playerSequence = []
    let currentStep = 0
    let showingSequence = false
    let waitingForInput = false
    let sequenceIndex = 0
    let lastGestureTime = 0
    let gestureTimeout = 15000
    let displayMessage = ''
    let messageTimer = 0

    let currentHeldGesture = 'no'
    let gestureHoldStartTime = 0
    let gestureHoldDuration = 3000
    let isHoldingGesture = false
    let holdProgress = 0

    const URL = 'https://teachablemachine.withgoogle.com/models/fQgIF8DJb/'

    const gestureNames = ['closedhand', 'openhand', 'peace', 'ok']
    const gestureLabels = ['MANO CERRADA', 'MANO ABIERTA', 'SÍMBOLO PAZ', 'SÍMBOLO OK']
    const gestureColors = [
      [255, 100, 100],
      [100, 255, 100],
      [100, 100, 255],
      [255, 255, 100],
    ]

    const startButtonStyle = ref({
      position: 'absolute',
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%)',
      fontSize: '24px',
      padding: '15px 30px',
      backgroundColor: '#4CAF50',
      color: 'white',
      border: 'none',
      borderRadius: '10px',
      boxShadow: '2px 2px 10px rgba(0, 0, 0, 0.3)',
      cursor: 'pointer',
      zIndex: 200,
    })

    const drawGestureHoldProgress = (p) => {
      if (!waitingForInput || currentStep >= sequence.length) return

      p.push()
      p.fill(255, 255, 255, 200)
      p.stroke(0)
      p.strokeWeight(2)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(20)
      p.pop()

      const barWidth = 300
      const barHeight = 20
      const barX = p.width / 2 - barWidth / 2
      const barY = p.height - 100

      p.push()
      p.fill(100, 100, 100, 150)
      p.stroke(255)
      p.strokeWeight(2)
      p.rect(barX, barY, barWidth, barHeight)

      const progressWidth = barWidth * holdProgress
      let progressColor = p.color(100, 255, 100)

      p.fill(progressColor)
      p.noStroke()
      p.rect(barX, barY, progressWidth, barHeight)

      p.fill(255)
      p.stroke(0)
      p.strokeWeight(1)
      p.textAlign(p.CENTER, p.CENTER)
      p.textSize(14)
      const progressPercent = Math.floor(holdProgress * 100)
      p.text(`${progressPercent}%`, p.width / 2, barY + barHeight / 2)

      const remainingTime = Math.max(0, gestureHoldDuration - (Date.now() - gestureHoldStartTime))
      const seconds = (remainingTime / 1000).toFixed(1)
      p.textSize(16)
      p.text(`${seconds}s`, p.width / 2, barY - 30)
      p.pop()
    }

    const initModel = async () => {
      try {
        const modelURL = URL + 'model.json'
        const metadataURL = URL + 'metadata.json'

        await loadTensorFlowLibraries()

        model = await window.tmImage.load(modelURL, metadataURL)
        maxPredictions = model.getTotalClasses()

        const flip = true
        webcam = new window.tmImage.Webcam(200, 200, flip)
        await webcam.setup({ facingMode: 'user' })
        await webcam.play()

        webcamContainer.value.appendChild(webcam.canvas)

        for (let i = 0; i < maxPredictions; i++) {
          const div = document.createElement('div')
          labelContainer.value.appendChild(div)
        }

        modelLoaded.value = true
        predictLoop()
      } catch (error) {
        console.error('Error loading model:', error)
        alert(
          'Error loading AI model. The game will work with keyboard controls (space=closedhand, enter=openhand, p=peace, o=ok).',
        )
        modelLoaded.value = true
      }
    }

    const loadTensorFlowLibraries = () => {
      return new Promise((resolve) => {
        if (window.tf && window.tmImage) {
          resolve()
          return
        }

        const scripts = [
          'https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@latest/dist/tf.min.js',
          'https://cdn.jsdelivr.net/npm/@teachablemachine/image@latest/dist/teachablemachine-image.min.js',
        ]

        let loadedScripts = 0

        scripts.forEach((src) => {
          const script = document.createElement('script')
          script.src = src
          script.onload = () => {
            loadedScripts++
            if (loadedScripts === scripts.length) {
              resolve()
            }
          }
          document.head.appendChild(script)
        })
      })
    }

    const predictLoop = async () => {
      if (webcam && model) {
        webcam.update()
        await predict()
      }
      requestAnimationFrame(predictLoop)
    }

    const predict = async () => {
      if (!model || !webcam) return

      const prediction = await model.predict(webcam.canvas)
      let highestProb = 0
      let predictedGesture = 'no'

      for (let i = 0; i < maxPredictions; i++) {
        const probability = prediction[i].probability
        const className = prediction[i].className

        if (labelContainer.value && labelContainer.value.childNodes[i]) {
          const labelElement = labelContainer.value.childNodes[i]
          labelElement.innerHTML = `${className}: ${(probability * 100).toFixed(1)}%`
          labelElement.style.color = '#009900'
        }

        if (probability > 0.7 && probability > highestProb) {
          highestProb = probability
          predictedGesture = className
        }
      }

      if (waitingForInput) {
        handleGestureHold(predictedGesture)
      }
    }

    const handleGestureHold = (gesture) => {
      const currentTime = Date.now()
      const expectedGesture = sequence[currentStep]
      const expectedGestureName = gestureNames[expectedGesture]

      if (gestureNames.includes(gesture) && gesture !== 'no') {
        if (!isHoldingGesture || currentHeldGesture !== gesture) {
          currentHeldGesture = gesture
          gestureHoldStartTime = currentTime
          isHoldingGesture = true
          holdProgress = 0
        } else {
          const elapsedTime = currentTime - gestureHoldStartTime
          holdProgress = Math.min(elapsedTime / gestureHoldDuration, 1)

          if (elapsedTime >= gestureHoldDuration) {
            if (currentHeldGesture === expectedGestureName) {
              handleGestureSuccess()
            } else {
              handleGestureFailure()
            }
            resetGestureHold()
          }
        }
      } else {
        if (isHoldingGesture) {
          resetGestureHold()
        }
      }
    }

    const resetGestureHold = () => {
      isHoldingGesture = false
      currentHeldGesture = 'no'
      gestureHoldStartTime = 0
      holdProgress = 0
    }

    const handleGestureSuccess = () => {
      const expectedGesture = sequence[currentStep]
      const gestureValue = gestureNames.indexOf(currentHeldGesture)

      if (gestureValue === expectedGesture) {
        playerSequence.push(gestureValue)
        currentStep++
        displayMessage = '¡Correcto!'
        messageTimer = 60
        lastGestureTime = Date.now()

        if (currentStep >= sequence.length) {
          score.value++
          displayMessage = '¡Muy bien! Preparando siguiente...'
          messageTimer = 120
          waitingForInput = false

          setTimeout(() => {
            nextRound()
          }, 2000)
        }
      }
    }

    const handleGestureFailure = () => {
      displayMessage = '¡Incorrecto!'
      messageTimer = 120
      waitingForInput = false
      gameOver.value = true
    }

    const nextRound = () => {
      sequence.push(Math.floor(Math.random() * 4))
      playerSequence = []
      currentStep = 0
      sequenceIndex = 0
      showingSequence = true
      displayMessage = 'Observa la secuencia...'
      messageTimer = 60
      resetGestureHold()
    }

    const sketch = (p) => {
      p.preload = () => {
        bgImgs.normal = p.loadImage('/images/background.png')
        bgImgs.gameOver = p.loadImage('/images/background2.png')
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.frameRate(60)
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
      }

      p.draw = () => {
        p.clear()

        if (!gameStarted.value) {
          p.image(bgImgs.normal, 0, 0, p.width, p.height)
          p.textAlign(p.CENTER, p.CENTER)
          p.textSize(28)
          p.fill(255)
          p.stroke(0)
          p.strokeWeight(3)
          p.text('¡Bienvenido/a a tu aventura en Simon Gestures!', p.width / 2, p.height / 2 - 100)
          p.noStroke()
          return
        }

        if (gameOver.value) {
          p.image(bgImgs.gameOver, 0, 0, p.width, p.height)
        } else {
          p.image(bgImgs.normal, 0, 0, p.width, p.height)
        }

        p.push()
        p.fill(0)
        p.textSize(24)
        p.textAlign(p.LEFT, p.TOP)
        p.text(`Score: ${score.value}`, 20, 20)
        p.pop()

        if (!gameOver.value) {
          if (showingSequence) {
            if (p.frameCount % 90 === 0) {
              if (sequenceIndex < sequence.length) {
                sequenceIndex++
              } else {
                showingSequence = false
                waitingForInput = true
                displayMessage = 'Tu turno: Mantén el gesto por 3 segundos'
                messageTimer = 180
                lastGestureTime = Date.now()
                resetGestureHold()
              }
            }
          }

          if (waitingForInput && Date.now() - lastGestureTime > gestureTimeout) {
            if (currentStep < sequence.length) {
              gameOver.value = true
              displayMessage = '¡Tiempo agotado!'
              waitingForInput = false
            }
          }

          drawGestureVisualization(p)

          if (waitingForInput) {
            drawGestureHoldProgress(p)
          }
        }

        if (messageTimer > 0) {
          p.push()
          p.fill(255, 255, 255, Math.min(255, messageTimer * 4))
          p.stroke(0)
          p.strokeWeight(2)
          p.textAlign(p.CENTER, p.CENTER)
          p.textSize(32)
          p.text(displayMessage, p.width / 2, p.height / 2 + 100)
          p.pop()
          messageTimer--
        }
      }

      const drawGestureVisualization = (p) => {
        const centerX = p.width / 2
        const centerY = p.height / 2
        const emojiSize = 120

        const gestureEmojis = ['✊', '✋', '✌️', '👍']

        if (showingSequence && sequenceIndex > 0) {
          const currentGesture = sequence[sequenceIndex - 1]
          const color = gestureColors[currentGesture]

          p.push()
          p.stroke(255, 255, 0)
          p.strokeWeight(5)
          p.fill(p.color(color[0], color[1], color[2], 100))
          p.ellipse(centerX, centerY, emojiSize + 40, emojiSize + 40)
          p.pop()

          p.push()
          p.textAlign(p.CENTER, p.CENTER)
          p.textSize(emojiSize)
          p.fill(255)
          p.noStroke()
          p.text(gestureEmojis[currentGesture], centerX, centerY)
          p.pop()

          p.push()
          p.fill(255)
          p.stroke(0)
          p.strokeWeight(2)
          p.textAlign(p.CENTER, p.CENTER)
          p.textSize(24)
          p.text(gestureLabels[currentGesture], centerX, centerY + 100)
          p.pop()
        }

        if (sequence.length > 0) {
          const startX = centerX - (sequence.length * 25) / 2
          const indicatorY = centerY - 150

          for (let i = 0; i < sequence.length; i++) {
            const x = startX + i * 30
            const color = gestureColors[sequence[i]]

            p.push()

            if (showingSequence && i < sequenceIndex) {
              p.fill(p.color(color[0], color[1], color[2]))
            } else if (waitingForInput && i < currentStep) {
              p.fill(100, 255, 100)
            } else if (waitingForInput && i === currentStep) {
              p.fill(255, 255, 100)
            } else {
              p.fill(100)
            }

            p.stroke(255)
            p.strokeWeight(2)
            p.ellipse(x, indicatorY, 20, 20)
            p.pop()
          }
        }
      }

      p.keyPressed = () => {
        if (gameStarted.value && !gameOver.value && waitingForInput) {
          let keyGesture = ''
          if (p.key === ' ') {
            keyGesture = 'closedhand'
          } else if (p.keyCode === p.ENTER) {
            keyGesture = 'openhand'
          } else if (p.key === 'p' || p.key === 'P') {
            keyGesture = 'peace'
          } else if (p.key === 'o' || p.key === 'O') {
            keyGesture = 'ok'
          }

          if (keyGesture) {
            handleGestureHold(keyGesture)
          }
        }
      }
    }

    const startGame = () => {
      gameStarted.value = true
      score.value = 0
      sequence = []
      playerSequence = []
      currentStep = 0
      showingSequence = false
      waitingForInput = false
      sequenceIndex = 0
      displayMessage = 'Comenzando...'
      messageTimer = 60
      resetGestureHold()

      setTimeout(() => {
        nextRound()
      }, 1000)
    }

    const restartGame = () => {
      gameOver.value = false
      gameStarted.value = true
      score.value = 0
      sequence = []
      playerSequence = []
      currentStep = 0
      showingSequence = false
      waitingForInput = false
      sequenceIndex = 0
      displayMessage = 'Comenzando...'
      messageTimer = 60
      resetGestureHold()

      if (labelContainer.value) {
        labelContainer.value.innerHTML = ''
        for (let i = 0; i < maxPredictions; i++) {
          const div = document.createElement('div')
          labelContainer.value.appendChild(div)
        }
      }

      setTimeout(() => {
        nextRound()
      }, 1000)
    }

    onMounted(async () => {
      await loadP5()

      p5Instance = new window.p5(sketch, p5Container.value)

      await initModel()
    })

    onUnmounted(() => {
      if (p5Instance) {
        p5Instance.remove()
      }
      if (webcam) {
        webcam.stop()
      }
    })

    const loadP5 = () => {
      return new Promise((resolve) => {
        if (window.p5) {
          resolve()
          return
        }

        const scripts = [
          'https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.9.0/p5.js',
          'https://cdnjs.cloudflare.com/ajax/libs/p5.js/0.9.0/addons/p5.dom.min.js',
        ]

        let loadedScripts = 0

        scripts.forEach((src) => {
          const script = document.createElement('script')
          script.src = src
          script.onload = () => {
            loadedScripts++
            if (loadedScripts === scripts.length) {
              resolve()
            }
          }
          document.head.appendChild(script)
        })
      })
    }

    return {
      webcamContainer,
      labelContainer,
      p5Container,
      gameStarted,
      gameOver,
      modelLoaded,
      score,
      startButtonStyle,
      startGame,
      restartGame,
    }
  },
}
</script>

<style scoped>
.simon-game {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
}

#webcam-container {
  position: fixed;
  top: 20px;
  right: 20px;
  width: 200px;
  height: 200px;
  border: 3px solid #fff;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
  z-index: 100;
}

#label-container {
  position: fixed;
  top: 230px;
  right: 20px;
  background: rgba(255, 255, 255, 0.9);
  padding: 10px;
  border-radius: 5px;
  font-family: Arial, sans-serif;
  z-index: 100;
}

.restart-button {
  position: absolute;
  top: 120px;
  left: 20px;
  font-size: 20px;
  padding: 10px 20px;
  background-color: #4caf50;
  color: white;
  border: none;
  border-radius: 10px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 200;
}

.back-button {
  position: absolute;
  top: 60px;
  left: 20px;
  font-size: 20px;
  padding: 10px 20px;
  background-color: #2196f3;
  color: white;
  border: none;
  border-radius: 10px;
  box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.3);
  cursor: pointer;
  z-index: 200;
  text-decoration: none;
}

.back-button:hover {
  background-color: #1976d2;
}

.restart-button:hover,
.start-button:hover {
  background-color: #45a049;
}

#p5-container {
  width: 100%;
  height: 100%;
}
</style>
