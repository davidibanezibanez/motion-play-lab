<template>
  <div class="dino-game">
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
  name: 'DinoGestureRush',
  setup() {
    const webcamContainer = ref(null)
    const labelContainer = ref(null)
    const p5Container = ref(null)

    const gameStarted = ref(false)
    const gameOver = ref(false)
    const modelLoaded = ref(false)
    const score = ref(0)

    let p5Instance = null
    let dino = null
    let obstacles = []
    let groundY = 0
    let model = null
    let webcam = null
    let maxPredictions = 0
    let lastPrediction = 'no jump'
    let dinoImg,
      treeImg,
      bgImgs = {}

    const URL = 'https://teachablemachine.withgoogle.com/models/7QcCp_D9h/'

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

    class Dino {
      constructor(groundY) {
        this.r = 50
        this.x = 50
        this.groundY = groundY
        this.y = groundY - this.r
        this.vy = 0
        this.gravity = 2
        this.jumpCount = 0
      }

      jump() {
        if (this.y === this.groundY - this.r) {
          this.vy = -35
          this.jumpCount++
        }
      }

      update() {
        this.y += this.vy
        this.vy += this.gravity

        if (this.y > this.groundY - this.r) {
          this.y = this.groundY - this.r
          this.vy = 0
        }
      }

      show(p) {
        p.image(dinoImg, this.x, this.y, this.r, this.r)
      }
    }

    class Obstacle {
      constructor(groundY, p) {
        this.w = 20
        this.h = 60
        this.x = p.width
        this.groundY = groundY
        this.y = groundY - this.h
        this.speed = 5
        this.counted = false
      }

      update() {
        this.x -= this.speed
      }

      offscreen() {
        return this.x < -this.w
      }

      show(p) {
        p.image(treeImg, this.x, this.y, this.w, this.h)
      }

      hits(dino) {
        return (
          dino.x < this.x + this.w * 0.8 &&
          dino.x + dino.r * 0.8 > this.x &&
          dino.y < this.y + this.h &&
          dino.y + dino.r > this.y
        )
      }
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
          'Error loading AI model. The game will work with keyboard controls (spacebar to jump).',
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

      for (let i = 0; i < maxPredictions; i++) {
        const probability = prediction[i].probability
        const className = prediction[i].className

        if (labelContainer.value && labelContainer.value.childNodes[i]) {
          const labelElement = labelContainer.value.childNodes[i]
          labelElement.innerHTML = `${className}: ${(probability * 100).toFixed(1)}%`
          if (className === 'jump') {
            labelElement.style.color = '#009900'
          } else if (className === 'no jump') {
            labelElement.style.color = '#009900'
          }
        }

        if (probability > 0.8 && probability > highestProb) {
          highestProb = probability
          lastPrediction = className
        }
      }
    }

    const sketch = (p) => {
      p.preload = () => {
        dinoImg = p.loadImage('/images/dino.png')
        treeImg = p.loadImage('/images/tree.png')
        bgImgs.normal = p.loadImage('/images/background.png')
        bgImgs.gameOver = p.loadImage('/images/background2.png')
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        groundY = p.height - 100
        dino = new Dino(groundY)
        obstacles.push(new Obstacle(groundY, p))
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
        groundY = p.height - 100
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
          p.text(
            '¡Bienvenido/a a tu aventura en Dino Gesture Rush!',
            p.width / 2,
            p.height / 2 - 100,
          )
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
          if (lastPrediction === 'jump' && dino.y === dino.groundY - dino.r) {
            dino.jump()
            lastPrediction = 'no jump'
          }

          dino.update()
          dino.show(p)

          if (p.frameCount % 90 === 0) {
            obstacles.push(new Obstacle(groundY, p))
          }

          for (let i = obstacles.length - 1; i >= 0; i--) {
            obstacles[i].update()
            obstacles[i].show(p)

            if (!obstacles[i].counted && obstacles[i].x + obstacles[i].w < dino.x) {
              obstacles[i].counted = true
              score.value++
            }

            if (obstacles[i].hits(dino)) {
              gameOver.value = true
              if (labelContainer.value) {
                const gameOverDiv = document.createElement('div')
                gameOverDiv.style.color = 'red'
                gameOverDiv.style.fontWeight = 'bold'
                gameOverDiv.innerHTML = 'GAME OVER'
                labelContainer.value.appendChild(gameOverDiv)
              }
            }

            if (obstacles[i].offscreen()) {
              obstacles.splice(i, 1)
            }
          }
        } else {
          dino.show(p)
          obstacles.forEach((o) => o.show(p))
        }

        p.stroke(0)
        p.line(0, groundY, p.width, groundY)
      }

      p.keyPressed = () => {
        if (p.key === ' ' || p.keyCode === p.UP_ARROW) {
          if (gameStarted.value && !gameOver.value) {
            dino.jump()
          }
        }
      }
    }

    const startGame = () => {
      gameStarted.value = true
      score.value = 0
      obstacles = []
      if (dino) {
        dino = new Dino(groundY)
      }
    }

    const restartGame = () => {
      gameOver.value = false
      gameStarted.value = true
      obstacles = []
      dino = new Dino(groundY)
      score.value = 0
      lastPrediction = 'no jump'

      if (labelContainer.value) {
        labelContainer.value.innerHTML = ''
        for (let i = 0; i < maxPredictions; i++) {
          const div = document.createElement('div')
          labelContainer.value.appendChild(div)
        }
      }
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
.dino-game {
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
