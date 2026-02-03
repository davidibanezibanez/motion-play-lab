# Motion Play Lab

## Overview

**Motion Play Lab** is an experimental web application that redefines browser gaming by replacing keyboard and mouse inputs with **computer vision**. Using your webcam and real-time gesture recognition, you can control arcade-style games simply by moving your hands or body.

This project leverages **Handsfree.js** to track skeletal landmarks directly in the browser, offering a "touchless" interactive experience without the need for specialized hardware or wearables.

## Games Included

The lab currently features three distinct motion-controlled experiences:

### 1. Dino Gesture Rush
A motion-controlled twist on the classic endless runner.
* **How to play:** Jump over obstacles (like cacti) by physically raising your hand or nodding your head (depending on configuration).
* **Tech:** Uses sprite animation and collision detection powered by Vue and p5.js.

### 2. Simon Gestures
A memory challenge inspired by "Simon Says".
* **How to play:** Watch the pattern of lights and repeat it by moving your hand to the corresponding screen quadrants.
* **Tech:** Spatial tracking to detect hand position relative to UI zones.

### 3. Serpent Motion
The classic Snake game, reimagined.
* **How to play:** Guide the serpent by moving your hand or head to direct its turn.
* **Tech:** Continuous tracking loop to map smooth physical movements to grid-based game logic.

## Technologies Used

* **Framework:** Vue 3 (Composition API)
* **Build Tool:** Vite
* **Styling:** TailwindCSS
* **Computer Vision:** Handsfree.js (wrapping MediaPipe/TensorFlow.js)
* **Graphics & Logic:** p5.js
* **Icons:** Lucide Vue
* **State Management:** Pinia (implied setup)

## Getting Started

Follow these steps to run the lab locally. **Note:** A webcam is required.

### Prerequisites

* Node.js (v16 or higher)
* npm

### Installation

1.  **Clone the repository**
    ```bash
    git clone [https://github.com/davidibanezibanez/motion-play-lab.git](https://github.com/davidibanezibanez/motion-play-lab.git)
    cd motion-play-lab/frontend-motion-play-lab
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Run the development server**
    ```bash
    npm run dev
    ```

4.  **Play!**
    Open your browser at `http://localhost:5173` (or the port shown in your terminal). Allow webcam access when prompted to enable gesture control.

## Important Note on Performance

Since this application runs complex computer vision models (pose estimation/hand tracking) directly in the browser, performance may vary depending on your hardware. Good lighting is recommended for accurate tracking.

## Contributing

1.  Fork the Project
2.  Create your Feature Branch (`git checkout -b feature/NewGame`)
3.  Commit your Changes
4.  Push to the Branch
5.  Open a Pull Request

## Contact

David Ibáñez - https://www.linkedin.com/in/davidibanezibanez/

Project Link: [https://github.com/davidibanezibanez/motion-play-lab](https://github.com/davidibanezibanez/motion-play-lab)
