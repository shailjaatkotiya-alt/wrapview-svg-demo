# Wrapview Demo

This project demonstrates the use of the Wrapview library along with Three.js for creating a 3D viewer. Below are the instructions on how to set up and run the project.

## Project Structure

```
wrapview-demo
├── index.html          # Main HTML document
├── src
│   ├── main.js        # Main JavaScript code
│   └── styles.css     # CSS styles for the project
├── libs
│   ├── three.r152.min.js       # Minified Three.js library (version 152)
│   ├── OrbitControls.js         # OrbitControls for camera control
│   ├── Wrapview.js              # Wrapview class for 3D viewer
│   ├── WrapviewUtils.js         # Utility functions for Wrapview
│   └── WrapviewSettings.js      # Configuration options for Wrapview
├── package.json       # npm configuration file
└── README.md          # Project documentation
```

## Getting Started

### Prerequisites

- A modern web browser (Chrome, Firefox, etc.)
- A local server (optional, but recommended for loading local files)

### Installation

1. Clone the repository or download the project files.
2. Navigate to the project directory.

### Running the Project

1. Open `index.html` in your web browser. If you are using a local server, start the server and navigate to the appropriate URL (e.g., `http://localhost:8000`).

### Usage

- The project initializes a 3D viewer using the Wrapview library.
- You can interact with the 3D scene using mouse controls provided by OrbitControls.

### Contributing

Feel free to fork the repository and submit pull requests for any improvements or bug fixes.

### License

This project is open-source and available under the MIT License.