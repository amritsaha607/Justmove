
// Our input frames will come from here.
const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');

var WIDTH=1280, HEIGHT=720;

// Moving rectangle positions
var curx = 0, endx = WIDTH, cury=20,
    rect_w=50, rect_h=20,
    speed=20, color='#f00';

// We'll add this to our control panel later, but we'll save it here so we can
// call tick() each time the graph runs.
const fpsControl = new FPS();
var a = 0;

function distance(p1, p2) {
  return ((p1.x-p2.x)**2 + (p1.y-p2.y)**2) ** 0.5;
}

// Optimization: Turn off animated spinner after its hiding animation is done.
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
  spinner.style.display = 'none';
};

function zColor(data) {
  const z = clamp(data.from.z + 0.5, 0, 1);
  return `rgba(0, ${255 * z}, ${255 * (1 - z)}, 1)`;
}

function onResults(results) {
  // Hide the spinner.
  document.body.classList.add('loaded');

  // Update the frame rate.
  fpsControl.tick();

  // Draw the overlays.
  canvasCtx.save();
  canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
  canvasCtx.drawImage(
    results.image, 0, 0, canvasElement.width, canvasElement.height);
  // drawConnectors(
  //   canvasCtx, results.poseLandmarks, POSE_CONNECTIONS, {
  //   visibilityMin: 0.65,
  //   color: (data) => {
  //     const x0 = canvasElement.width * data.from.x;
  //     const y0 = canvasElement.height * data.from.y;
  //     const x1 = canvasElement.width * data.to.x;
  //     const y1 = canvasElement.height * data.to.y;

  //     const z0 = clamp(data.from.z + 0.5, 0, 1);
  //     const z1 = clamp(data.to.z + 0.5, 0, 1);

  //     const gradient = canvasCtx.createLinearGradient(x0, y0, x1, y1);
  //     gradient.addColorStop(
  //       0, `rgba(0, ${255 * z0}, ${255 * (1 - z0)}, 1)`);
  //     gradient.addColorStop(
  //       1.0, `rgba(0, ${255 * z1}, ${255 * (1 - z1)}, 1)`);
  //     return gradient;
  //   }
  // });
  // drawLandmarks(
  //   canvasCtx,
  //   Object.values(POSE_LANDMARKS_LEFT)
  //     .map(index => results.poseLandmarks[index]),
  //   { visibilityMin: 0.65, color: zColor, fillColor: '#FF0000' });
  // drawLandmarks(
  //   canvasCtx,
  //   Object.values(POSE_LANDMARKS_RIGHT)
  //     .map(index => results.poseLandmarks[index]),
  //   { visibilityMin: 0.65, color: zColor, fillColor: '#00FF00' });
  // drawLandmarks(
  //   canvasCtx,
  //   Object.values(POSE_LANDMARKS_NEUTRAL)
  //     .map(index => results.poseLandmarks[index]),
  //   { visibilityMin: 0.65, color: zColor, fillColor: '#AAAAAA' });
  canvasCtx.restore();

  if (true) {
    var nose = results.poseLandmarks[0],
        left_eye = results.poseLandmarks[7],
        right_eye = results.poseLandmarks[8];
    var head_x = nose.x,
        head_y = nose.y - 3*(distance(nose, left_eye)+distance(nose, right_eye))/2;
    a += 1;

    var head = {
      'x': head_x,
      'y': head_y,
      'z': 0,
      'visibility': 1,
    };

    drawLandmarks(
      canvasCtx,
      [head],
      { visibilityMin: 0.65, color: zColor, fillColor: '#AAAAAA' });

    if (curx + rect_w < WIDTH) {curx += speed;}
    else {
      curx = 0;
      cury = 10 + Math.random() * HEIGHT / 2;
      color = Math.random() > 0.5 ? '#f00' : '#0f0';
    }
    drawRectangle(canvasCtx, curx, cury, rect_w, rect_h, color=color);

  }
}

const pose = new Pose({
  locateFile: (file) => {
    return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@0.2/${file}`;
  }
});
pose.onResults(onResults);

/**
 * Instantiate a camera. We'll feed each frame we receive into the solution.
 */
const camera = new Camera(videoElement, {
  onFrame: async () => {
    await pose.send({ image: videoElement });
  },
  width: WIDTH,
  height: HEIGHT
});
camera.start();

// Present a control panel through which the user can manipulate the solution
// options.
new ControlPanel(controlsElement, {
  selfieMode: true,
  upperBodyOnly: false,
  smoothLandmarks: true,
  minDetectionConfidence: 0.5,
  minTrackingConfidence: 0.5
})
  .add([
    new StaticText({ title: 'MediaPipe Pose' }),
    fpsControl,
    new Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new Toggle({ title: 'Upper-body Only', field: 'upperBodyOnly' }),
    new Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new Slider({
      title: 'Min Detection Confidence',
      field: 'minDetectionConfidence',
      range: [0, 1],
      step: 0.01
    }),
    new Slider({
      title: 'Min Tracking Confidence',
      field: 'minTrackingConfidence',
      range: [0, 1],
      step: 0.01
    }),
  ])
  .on(options => {
    videoElement.classList.toggle('selfie', options.selfieMode);
    pose.setOptions(options);
  });


function drawRectangle(ctx, x, y, w, h, color='#000') {
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w, h);
}

