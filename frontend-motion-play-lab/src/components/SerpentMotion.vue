<template>
  <div class="serpent-game">
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
  name: 'SerpentMotion',
  setup() {
    const webcamContainer = ref(null)
    const labelContainer = ref(null)
    const p5Container = ref(null)

    const gameStarted = ref(false)
    const gameOver = ref(false)
    const modelLoaded = ref(false)
    const score = ref(0)

    let p5Instance = null
    let snake = null
    let food = null
    let model = null
    let webcam = null
    let maxPredictions = 0
    let lastPrediction = 'none'
    let bgImgs = {}
    let scl = 40

    let gameArea = {
      x: 0,
      y: 0,
      width: 960,
      height: 720,
    }

    const URL = 'https://teachablemachine.withgoogle.com/models/7w0NZcMsZ/'

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

    class Snake {
      constructor(p) {
        this.body = []
        const startX = gameArea.x + Math.floor(gameArea.width / 2 / scl) * scl
        const startY = gameArea.y + Math.floor(gameArea.height / 2 / scl) * scl
        this.body[0] = p.createVector(startX, startY)
        this.xdir = 0
        this.ydir = 0
        this.len = 1
      }

      setDir(x, y) {
        this.xdir = x
        this.ydir = y
      }

      update() {
        let head = this.body[this.body.length - 1].copy()

        if (this.body.length >= this.len) {
          this.body.shift()
        }

        head.x += this.xdir
        head.y += this.ydir
        this.body.push(head)
      }

      grow() {
        this.len++
      }

      endGame() {
        let x = this.body[this.body.length - 1].x
        let y = this.body[this.body.length - 1].y

        if (
          x >= gameArea.x + gameArea.width ||
          x < gameArea.x ||
          y >= gameArea.y + gameArea.height ||
          y < gameArea.y
        ) {
          return true
        }

        for (let i = 0; i < this.body.length - 1; i++) {
          let part = this.body[i]
          if (part.x === x && part.y === y) {
            return true
          }
        }
        return false
      }

      eat(pos) {
        let x = this.body[this.body.length - 1].x
        let y = this.body[this.body.length - 1].y
        if (x === pos.x && y === pos.y) {
          this.grow()
          return true
        }
        return false
      }

      show(p) {
        for (let i = 0; i < this.body.length; i++) {
          p.fill(0, 255, 0)
          if (i === this.body.length - 1) {
            p.fill(0, 200, 0)
          }
          p.rect(this.body[i].x, this.body[i].y, scl, scl)
        }
      }
    }

    class Food {
      constructor(p) {
        this.pickLocation(p)
      }

      pickLocation(p) {
        let cols = Math.floor(gameArea.width / scl)
        let rows = Math.floor(gameArea.height / scl)
        let x = gameArea.x + Math.floor(Math.random() * cols) * scl
        let y = gameArea.y + Math.floor(Math.random() * rows) * scl
        this.pos = p.createVector(x, y)
      }

      show(p) {
        p.fill(255, 0, 100)
        p.rect(this.pos.x, this.pos.y, scl, scl)
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
        alert('Error loading AI model. The game will work with arrow key controls.')
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
      let predictedDirection = 'none'

      for (let i = 0; i < maxPredictions; i++) {
        const probability = prediction[i].probability
        const className = prediction[i].className

        if (labelContainer.value && labelContainer.value.childNodes[i]) {
          const labelElement = labelContainer.value.childNodes[i]
          labelElement.innerHTML = `${className}: ${(probability * 100).toFixed(1)}%`
          labelElement.style.color = '#009900'
        }

        if (probability > 0.6 && probability > highestProb) {
          highestProb = probability
          predictedDirection = className
        }
      }

      if (predictedDirection !== 'none') {
        lastPrediction = predictedDirection
      }
    }

    const sketch = (p) => {
      p.preload = () => {
        bgImgs.normal = p.loadImage('/images/background.png')
        bgImgs.gameOver = p.loadImage('/images/background2.png')
      }

      p.setup = () => {
        p.createCanvas(p.windowWidth, p.windowHeight)
        p.frameRate(3)

        gameArea.x = (p.width - gameArea.width) / 2
        gameArea.y = (p.height - gameArea.height) / 2

        snake = new Snake(p)
        food = new Food(p)
      }

      p.windowResized = () => {
        p.resizeCanvas(p.windowWidth, p.windowHeight)
        gameArea.x = (p.width - gameArea.width) / 2
        gameArea.y = (p.height - gameArea.height) / 2
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
          p.text('¡Bienvenido/a a tu aventura en Serpent Motion!', p.width / 2, p.height / 2 - 100)
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
          if (lastPrediction === 'up' && snake.ydir === 0) {
            snake.setDir(0, -scl)
            lastPrediction = 'none'
          } else if (lastPrediction === 'down' && snake.ydir === 0) {
            snake.setDir(0, scl)
            lastPrediction = 'none'
          } else if (lastPrediction === 'left' && snake.xdir === 0) {
            snake.setDir(-scl, 0)
            lastPrediction = 'none'
          } else if (lastPrediction === 'right' && snake.xdir === 0) {
            snake.setDir(scl, 0)
            lastPrediction = 'none'
          }

          snake.update()

          if (snake.eat(food.pos)) {
            score.value++
            food.pickLocation(p)
            console.log('¡Comida comida! Score:', score.value)
          }

          if (snake.endGame()) {
            gameOver.value = true
            if (labelContainer.value) {
              const gameOverDiv = document.createElement('div')
              gameOverDiv.style.color = 'red'
              gameOverDiv.style.fontWeight = 'bold'
              gameOverDiv.innerHTML = 'GAME OVER'
              labelContainer.value.appendChild(gameOverDiv)
            }
          }
        }

        p.stroke(0)
        p.strokeWeight(3)
        p.noFill()
        p.rect(gameArea.x, gameArea.y, gameArea.width, gameArea.height)

        food.show(p)
        snake.show(p)
      }

      p.keyPressed = () => {
        if (gameStarted.value && !gameOver.value) {
          if (p.keyCode === p.UP_ARROW && snake.ydir === 0) {
            snake.setDir(0, -scl)
          } else if (p.keyCode === p.DOWN_ARROW && snake.ydir === 0) {
            snake.setDir(0, scl)
          } else if (p.keyCode === p.LEFT_ARROW && snake.xdir === 0) {
            snake.setDir(-scl, 0)
          } else if (p.keyCode === p.RIGHT_ARROW && snake.xdir === 0) {
            snake.setDir(scl, 0)
          }
        }
      }
    }

    const startGame = () => {
      gameStarted.value = true
      score.value = 0
      if (p5Instance) {
        gameArea.x = (p5Instance.width - gameArea.width) / 2
        gameArea.y = (p5Instance.height - gameArea.height) / 2
        snake = new Snake(p5Instance)
        food = new Food(p5Instance)
      }
    }

    const restartGame = () => {
      gameOver.value = false
      gameStarted.value = true
      score.value = 0
      lastPrediction = 'none'

      if (p5Instance) {
        gameArea.x = (p5Instance.width - gameArea.width) / 2
        gameArea.y = (p5Instance.height - gameArea.height) / 2
        snake = new Snake(p5Instance)
        food = new Food(p5Instance)
      }

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
.serpent-game {
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
