<template>
  <div class="home-container">
    <div class="background-overlay"></div>
    <div class="content">
      <h1 class="title">🎮 Motion Play Lab</h1>

      <div class="games-row">
        <div class="game-card">
          <div class="game-icon">🦕</div>
          <h3>Dino Gesture Rush</h3>
          <p>
            En esta aventura: ¡Abre tu mano para saltar y no dejes que el dinosaurio choque con los
            árboles!
          </p>
          <router-link to="/dino" class="play-button"> ¡Jugar! </router-link>
        </div>

        <div class="game-card">
          <div class="game-icon">🐍</div>
          <h3>Serpent Motion</h3>
          <p>
            En esta aventura: ¡Controla la serpiente con los dedos índice de tus dos manos, come
            fruta para crecer y no dejes que choque con los muros!
          </p>
          <router-link to="/serpent" class="play-button"> ¡Jugar! </router-link>
        </div>

        <div class="game-card">
          <div class="game-icon">🔴</div>
          <h3>Simon Gestures</h3>
          <p>En esta aventura: ¡Memoriza la secuencia y repite los gestos con tu propia mano!</p>
          <router-link to="/simon" class="play-button"> ¡Jugar! </router-link>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'HomeMotionPlayLab',
  mounted() {
    document.title = 'Motion Play Lab'
  },
}
</script>

<style scoped>
html,
body {
  height: 100%;
  width: 100%;
  overflow: hidden;
  margin: 0;
}

.home-container {
  height: 100vh;
  width: 100vw;
  background-image: url('/images/background.png');
  background-size: cover;
  background-position: center;
  background-attachment: fixed;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0 40px;
  position: relative;
}

.background-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(2px);
}

.content {
  position: relative;
  z-index: 1;
  text-align: center;
  width: 100%;
}

.title {
  font-size: 3.5rem;
  color: white;
  margin-bottom: 40px;
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.8);
  font-weight: bold;
  animation: glow 2s ease-in-out infinite alternate;
}

@keyframes glow {
  from {
    text-shadow:
      3px 3px 6px rgba(0, 0, 0, 0.8),
      0 0 20px rgba(255, 255, 255, 0.3);
  }
  to {
    text-shadow:
      3px 3px 6px rgba(0, 0, 0, 0.8),
      0 0 30px rgba(255, 255, 255, 0.6);
  }
}

.games-row {
  display: flex;
  justify-content: space-between;
  align-items: stretch;
  gap: 30px;
  width: 100%;
}

.game-card {
  flex: 1 1 0;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20px;
  padding: 30px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.game-card:hover {
  transform: translateY(-10px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.4);
}

.game-icon {
  font-size: 4rem;
  margin-bottom: 15px;
  animation: bounce 2s infinite;
}

@keyframes bounce {
  0%,
  20%,
  50%,
  80%,
  100% {
    transform: translateY(0);
  }
  40% {
    transform: translateY(-10px);
  }
  60% {
    transform: translateY(-5px);
  }
}

.game-card h3 {
  font-size: 1.5rem;
  color: #333;
  margin-bottom: 15px;
  font-weight: bold;
}

.game-card p {
  color: #666;
  margin-bottom: 20px;
  line-height: 1.5;
  flex: 1 1 auto;
}

.play-button {
  display: inline-block;
  padding: 12px 30px;
  background: linear-gradient(45deg, #4caf50, #45a049);
  color: white;
  text-decoration: none;
  border-radius: 25px;
  font-weight: bold;
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 1px;
  box-shadow: 0 4px 15px rgba(76, 175, 80, 0.3);
}

.play-button:hover {
  background: linear-gradient(45deg, #45a049, #4caf50);
  transform: translateY(-2px);
  box-shadow: 0 6px 20px rgba(76, 175, 80, 0.4);
}

.play-button.disabled {
  background: linear-gradient(45deg, #ccc, #999);
  cursor: not-allowed;
  box-shadow: 0 4px 15px rgba(153, 153, 153, 0.3);
  pointer-events: none;
}
</style>
