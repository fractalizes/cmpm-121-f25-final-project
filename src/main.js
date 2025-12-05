// note: three helps with rendering, ammo helps with physics
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// https://medium.com/@bluemagnificent/moving-objects-in-javascript-3d-physics-using-ammo-js-and-three-js-6e39eff6d9e5
// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import {
  initContactPairResultCallback,
  initContactResultCallback,
  initEventHandlers,
  initGraphics,
  initPhysicsWorld,
} from "./initialization.js";

// ----------------------------------- //
// ---                             --- //
// ---          VARIABLES          --- //
// ---                             --- //
// ----------------------------------- //

let physicsWorld, scene, camera, renderer, clock;
let tempTransformation = undefined;
let cbContactResult,
  cbContactPairResult;
let playerBall = null,
  playerBody = null,
  ballsUsed = 0,
  popUp = false;
let puzzleBlock = null,
  puzzleBody = null;
let groundBlock = null;

let moveTarget = null;
let currentRoom = 1;
let doorBlock = null;

const rigidBodies = [];
const mouseCoords = new THREE.Vector2(),
  raycaster = new THREE.Raycaster(),
  aimTarget = new THREE.Vector3();

function setMouseFromEvent(event) {
  // Use the actual canvas position/size, not full window
  const rect = renderer.domElement.getBoundingClientRect();
  mouseCoords.set(
    ((event.clientX - rect.left) / rect.width) * 2 - 1,
    -((event.clientY - rect.top) / rect.height) * 2 + 1,
  );
}

const STATE = { DISABLE_DEACTIVATION: 4 };
const FLAGS = { CF_KINEMATIC_OBJ: 2 };

const cameraOffset = new THREE.Vector3(0, 20, 40);
const cameraSmoothness = 0.05;

// Camera orbit controls (right-mouse drag)
let isRightMouseDown = false;
let lastMouseX = 0;
let lastMouseY = 0;

// Convert the base offset into spherical-style angles
let cameraYaw = Math.atan2(cameraOffset.x, cameraOffset.z);
let cameraPitch = Math.asin(
  cameraOffset.y / cameraOffset.length(),
);

// Limits + speed
const minPitch = -Math.PI / 6; // look slightly down
const maxPitch = Math.PI / 3; // look somewhat up
const rotateSpeed = 0.005; // radians per pixel

// Camera collision
const cameraCollisionObjects = [];
const cameraCollisionOffset = 0.5; // how far in front of a wall the camera stops

const equippableBalls = [];
export const canShoot = { value: false };
canShoot.value = false;
export let numBalls = 0;
const totalBalls = 8;

let checkBallHit = false;

// ----------------------------------- //
// ---                             --- //
// ---         UI ELEMENTS         --- //
// ---                             --- //
// ----------------------------------- //

const ballCounterDiv = document.getElementById("ballCounter");

// initialize ammo
Ammo().then(start);

function start() {
  tempTransformation = new Ammo.btTransform();

  // initialize ammo environment configurations
  physicsWorld = initPhysicsWorld();
  const { scene: s, camera: c, renderer: r, clock: k } = initGraphics();
  scene = s, camera = c, renderer = r, clock = k;
  initEventHandlers();
  initCameraControls();

  createGround();
  createPlayer();
  createKinematicBox();

  createEquippableBalls();
  createRoom();
  createDoor();
  updateBallCounter();
  showStartupMessage();

  cbContactResult = initContactResultCallback();
  cbContactPairResult = initContactPairResultCallback();

  renderFrame();
}

function initCameraControls() {
  const domElement = renderer.domElement;

  // Prevent the default context menu on right-click
  domElement.addEventListener("contextmenu", (e) => {
    e.preventDefault();
  });

  domElement.addEventListener("mousedown", (e) => {
    if (e.button === 2) {
      // right mouse button
      isRightMouseDown = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    }
  });

  domElement.addEventListener("mouseup", (e) => {
    if (e.button === 2) {
      isRightMouseDown = false;
    }
  });

  domElement.addEventListener("mouseleave", () => {
    isRightMouseDown = false;
  });

  domElement.addEventListener("mousemove", (e) => {
    if (isRightMouseDown) {
      const deltaX = e.clientX - lastMouseX;
      const deltaY = e.clientY - lastMouseY;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;

      // Horizontal drag rotates the camera around the player
      cameraYaw -= deltaX * rotateSpeed;

      // Vertical drag tilts up/down (clamped)
      cameraPitch = Math.max(
        minPitch,
        Math.min(maxPitch, cameraPitch - deltaY * rotateSpeed),
      );
    } else {
      // only update mouseCoords and aimTarget when not dragging right click
      setMouseFromEvent(e);
      updateAimPoint(e);
    }
  });
}

function renderFrame() {
  const deltaTime = clock.getDelta();

  movePlayer();
  checkContact();
  doorCollision();
  if (!popUp) blockHitsFloor();

  updatePhysics(deltaTime);
  updateCameraFollow();

  renderer.render(scene, camera);

  // recursion to keep updating every frame
  requestAnimationFrame(renderFrame);
}

// ----------------------------------- //
// ---                             --- //
// ---      GAMEWORLD OBJECTS      --- //
// ---                             --- //
// ----------------------------------- //

function createGround() {
  const pos = { x: 0, y: 0, z: 0 },
    scale = { x: 500, y: 1, z: 500 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 0,
    color = 0xa0afa4;

  const { body: groundBody, block: block } = createBlock(
    pos,
    scale,
    quat,
    mass,
    color,
  );
  groundBlock = block;

  cameraCollisionObjects.push(groundBlock);

  groundBody.setFriction(4);
  groundBody.setRollingFriction(10);
  physicsWorld.addRigidBody(groundBody);

  groundBlock.userData.physicsBody = groundBody;
}

function createPlayer() {
  const pos = { x: 0, y: 20, z: 0 },
    radius = 2,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0xff0505;

  const { ball: ball, body: body } = createBall(pos, radius, quat, mass, color);
  playerBall = ball, playerBody = body;

  playerBody.setFriction(4);
  playerBody.setRollingFriction(10);
  playerBody.setActivationState(STATE.DISABLE_DEACTIVATION);

  physicsWorld.addRigidBody(playerBody);

  playerBall.userData.physicsBody = playerBody;
  rigidBodies.push(playerBall);
}

function createKinematicBox() {
  const pos = { x: 40, y: 5, z: 5 },
    scale = { x: 10, y: 10, z: 10 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0x30ab78;

  const { block: box, body: body } = createBlock(
    pos,
    scale,
    quat,
    mass,
    color,
  );

  body.setActivationState(STATE.DISABLE_DEACTIVATION);
  body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJ);

  physicsWorld.addRigidBody(body);
  box.userData.physicsBody = body;

  return { box, body };
}

function createPuzzleBox() {
  const pos = { x: 40, y: 10, z: 5 },
    scale = { x: 5, y: 5, z: 5 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0xff9500;

  const { block: block, body: body } = createBlock(
    pos,
    scale,
    quat,
    mass,
    color,
  );
  puzzleBlock = block, puzzleBody = body;

  puzzleBody.setFriction(4);
  puzzleBody.setRollingFriction(10);
  puzzleBody.setActivationState(STATE.DISABLE_DEACTIVATION);

  physicsWorld.addRigidBody(puzzleBody);

  puzzleBlock.userData.physicsBody = puzzleBody;
  rigidBodies.push(puzzleBlock);
}

function createRoom() {
  const roomSize = 500,
    wallHeight = 80,
    wallThickness = 5;
  const friction = 4;

  {
    const pos = { x: -roomSize / 2, y: wallHeight / 2, z: 0 },
      scale = { x: wallThickness, y: wallHeight, z: roomSize },
      quat = { x: 0, y: 0, z: 0, w: 1 },
      mass = 0,
      color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    cameraCollisionObjects.push(block);
    body.setFriction(friction);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: roomSize / 2, y: wallHeight / 2, z: 0 },
      scale = { x: wallThickness, y: wallHeight, z: roomSize },
      quat = { x: 0, y: 0, z: 0, w: 1 },
      mass = 0,
      color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    cameraCollisionObjects.push(block);
    body.setFriction(friction);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: 0, y: wallHeight / 2, z: -roomSize / 2 },
      scale = { x: roomSize, y: wallHeight, z: wallThickness },
      quat = { x: 0, y: 0, z: 0, w: 1 },
      mass = 0,
      color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    cameraCollisionObjects.push(block);
    body.setFriction(friction);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: 0, y: wallHeight / 2, z: roomSize / 2 },
      scale = { x: roomSize, y: wallHeight, z: wallThickness },
      quat = { x: 0, y: 0, z: 0, w: 1 },
      mass = 0,
      color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    cameraCollisionObjects.push(block);
    body.setFriction(friction);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }
}

function createDoor() {
  const pos = { x: 0, y: 20, z: -245 },
    scale = { x: 30, y: 40, z: 5 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 0,
    color = 0x2244ff;

  const { block, body } = createBlock(pos, scale, quat, mass, color);
  doorBlock = block;
  cameraCollisionObjects.push(doorBlock);
  doorBlock.userData.physicsBody = body;
  physicsWorld.addRigidBody(body);
  rigidBodies.push(block);
}

function createEquippableBalls() {
  const numEquipBalls = 8;
  const radius = 2,
    height = 3,
    color = 0x00aaff;

  const roomSize = 500,
    minDistance = 80,
    maxRetries = 100;

  const placedPositions = [];
  const playerPos = new THREE.Vector3(0, 20, 0);

  function isFarEnough(pos) {
    if (pos.distanceTo(playerPos) < minDistance) {
      return false;
    }

    for (const placed of placedPositions) {
      if (pos.distanceTo(placed) < minDistance) {
        return false;
      }
    }

    return true;
  }

  for (let i = 0; i < numEquipBalls; i++) {
    let pos, attempts;
    for (attempts = 0; attempts < maxRetries; attempts++) {
      pos = new THREE.Vector3(
        (Math.random() - 0.5) * roomSize,
        height,
        (Math.random() - 0.5) * roomSize,
      );
      if (isFarEnough(pos)) break;
    }

    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 1;

    const { ball, body } = createBall(
      { x: pos.x, y: pos.y, z: pos.z },
      radius,
      quat,
      mass,
      color,
    );

    ball.userData.physicsBody = body;
    equippableBalls.push(ball);

    ball.userData == "ground";
    body.setActivationState(STATE.DISABLE_DEACTIVATION);
    physicsWorld.addRigidBody(body);
  }
}

// ----------------------------------- //
// ---                             --- //
// ---           HELPERS           --- //
// ---                             --- //
// ----------------------------------- //

function createBlock(pos, scale, quat, mass, color) {
  const block = new THREE.Mesh(
    new THREE.BoxGeometry(scale.x, scale.y, scale.z),
    new THREE.MeshPhongMaterial({ color: color }),
  );

  block.position.set(pos.x, pos.y, pos.z);

  block.castShadow = true;
  block.receiveShadow = true;

  scene.add(block);

  const transform = new Ammo.btTransform();
  transform.setIdentity(); // resets any existing transformation

  transform.setOrigin(
    new Ammo.btVector3(
      pos.x,
      pos.y,
      pos.z,
    ),
  );
  transform.setRotation(
    new Ammo.btQuaternion(
      quat.x,
      quat.y,
      quat.z,
      quat.w,
    ),
  );
  const motionState = new Ammo.btDefaultMotionState(transform);

  const colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(
      scale.x * 0.5,
      scale.y * 0.5,
      scale.z * 0.5,
    ),
  );
  colShape.setMargin(0.05);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia,
  );
  const body = new Ammo.btRigidBody(rbInfo);

  return { block, body };
}

function createBall(pos, radius, quat, mass, color) {
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshPhongMaterial({ color: color }),
  );

  ball.position.set(pos.x, pos.y, pos.z);

  ball.castShadow = true;
  ball.receiveShadow = true;

  scene.add(ball);

  const transform = new Ammo.btTransform();
  transform.setIdentity(); // resets any existing transformation

  transform.setOrigin(
    new Ammo.btVector3(
      pos.x,
      pos.y,
      pos.z,
    ),
  );
  transform.setRotation(
    new Ammo.btQuaternion(
      quat.x,
      quat.y,
      quat.z,
      quat.w,
    ),
  );
  const motionState = new Ammo.btDefaultMotionState(transform);

  const colShape = new Ammo.btSphereShape(radius);
  colShape.setMargin(0.05);

  const localInertia = new Ammo.btVector3(0, 0, 0);
  colShape.calculateLocalInertia(mass, localInertia);

  const rbInfo = new Ammo.btRigidBodyConstructionInfo(
    mass,
    motionState,
    colShape,
    localInertia,
  );
  const body = new Ammo.btRigidBody(rbInfo);

  return { ball, body };
}

function checkContact() {
  // checks for contact between any object
  physicsWorld.contactTest(playerBall.userData.physicsBody, cbContactResult);
}

function updateBallCounter() {
  ballCounterDiv.textContent = "Balls: " + numBalls;
}

function showStartupMessage() {
    const msg = document.getElementById("gameMessage");

    msg.innerHTML = `
        Left click to move/pick up balls.<br>
        Hold right click to pan the camera.<br>
        Press SPACE to shoot balls.
    `;

    msg.style.display = "block";

    // Hide message after 20 seconds
    setTimeout(() => {
        msg.style.display = "none";
    }, 20000);
}

// ----------------------------------- //
// ---                             --- //
// ---       CORE GAME LOGIC       --- //
// ---                             --- //
// ----------------------------------- //

function movePlayer() {
  if (!playerBody || !playerBall || !moveTarget) return;

  const currentPos = playerBall.position;
  const direction = moveTarget.clone().sub(currentPos).setY(
    groundBlock.position.y,
  );

  // when close enough to target location
  if (direction.lengthSq() < 1) {
    moveTarget = null;
    playerBody.setLinearVelocity(new Ammo.btVector3(0, 0, 0));
    return;
  }
  direction.normalize();

  const speed = 20;
  const velocity = new Ammo.btVector3(
    direction.x * speed,
    0,
    direction.z * speed,
  );

  playerBody.setLinearVelocity(velocity);
}

function updateCameraFollow() {
  if (!playerBody) return;
  const ballPos = rigidBodies[0].position;

  // Compute dynamic offset from yaw/pitch
  const radius = cameraOffset.length();
  const y = radius * Math.sin(cameraPitch);
  const horizontalRadius = radius * Math.cos(cameraPitch);
  const x = horizontalRadius * Math.sin(cameraYaw);
  const z = horizontalRadius * Math.cos(cameraYaw);

  const desiredPos = new THREE.Vector3(
    ballPos.x + x,
    ballPos.y + y,
    ballPos.z + z,
  );

  const origin = new THREE.Vector3(ballPos.x, ballPos.y, ballPos.z);
  const direction = new THREE.Vector3()
    .subVectors(desiredPos, origin)
    .normalize();

  // deno-lint-ignore prefer-const
  let finalPos = desiredPos.clone();

  if (cameraCollisionObjects.length > 0) {
    raycaster.set(origin, direction);
    raycaster.far = radius; // only check up to the desired distance

    const hits = raycaster.intersectObjects(cameraCollisionObjects, false);

    if (hits.length > 0) {
      // Put camera just before the first hit
      finalPos.copy(hits[0].point).addScaledVector(
        direction,
        -cameraCollisionOffset,
      );
    }
  }

  camera.position.lerp(finalPos, cameraSmoothness);
  camera.lookAt(ballPos);
}

export function clickEquipBalls(event) {
  if (event.button !== 0) return false;

  if (equippableBalls.length === 0) return false;
  // AAAAAAA
  // Get mouse position relative to the canvas in pixels
  const rect = renderer.domElement.getBoundingClientRect();
  const mouseX = event.clientX - rect.left;
  const mouseY = event.clientY - rect.top;

  // How close (in pixels) the click must be to count as hitting a ball
  const maxClickDist = 30;
  const maxClickDistSq = maxClickDist * maxClickDist;

  let closestBall = null;
  let closestDistSq = Infinity;

  // Find the ball whose projected screen position is closest to the mouse
  for (const ball of equippableBalls) {
    const screenPos = ball.position.clone().project(camera);

    // Convert from NDC (-1..1) to pixel coords
    const ballX = (screenPos.x * 0.5 + 0.5) * rect.width;
    const ballY = (-screenPos.y * 0.5 + 0.5) * rect.height;

    const dx = ballX - mouseX;
    const dy = ballY - mouseY;
    const distSq = dx * dx + dy * dy;

    if (distSq < maxClickDistSq && distSq < closestDistSq) {
      closestDistSq = distSq;
      closestBall = ball;
    }
  }

  // Nothing close enough to the click
  if (!closestBall) return false;

  const clicked = closestBall;
  const body = clicked.userData.physicsBody;

  canShoot.value = true;
  console.log("Ball Clicked!");

  scene.remove(clicked);
  physicsWorld.removeRigidBody(body);

  for (let i = 0; i < equippableBalls.length; i++) {
    if (equippableBalls[i] === clicked) {
      equippableBalls[i] = equippableBalls[equippableBalls.length - 1];
      equippableBalls.length--;
      console.log("ball removed");
      numBalls++;
      updateBallCounter();
      break;
    }
  }
  return true;
}

export function updateAimPoint(event) {
  if (isRightMouseDown) return; // prevent aimTarget updates during camera control
  setMouseFromEvent(event);
  raycaster.setFromCamera(mouseCoords, camera);

  const groundPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    groundBlock.position.y,
  );
  const intersection = new THREE.Vector3();

  if (!raycaster.ray.intersectPlane(groundPlane, intersection)) return;
  aimTarget.copy(raycaster.ray.direction);
  aimTarget.add(raycaster.ray.origin);
}

export function clickMovePlayer(event) {
  if (event.button !== 0) return;
  setMouseFromEvent(event);
  raycaster.setFromCamera(mouseCoords, camera);

  const groundPlane = new THREE.Plane(
    new THREE.Vector3(0, 1, 0),
    groundBlock.position.y,
  );
  const intersection = new THREE.Vector3();

  if (!raycaster.ray.intersectPlane(groundPlane, intersection)) return;
  moveTarget = intersection.clone();
}

function updatePhysics(deltaTime) {
  // advance a "step" in the world
  physicsWorld.stepSimulation(deltaTime, 10);

  // update rigid bodies
  rigidBodies.forEach((body) => {
    const objThree = body;
    const objAmmo = objThree.userData.physicsBody;
    const ms = objAmmo.getMotionState();

    if (ms) {
      ms.getWorldTransform(tempTransformation);
      const p = tempTransformation.getOrigin(),
        q = tempTransformation.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  });
}

function doorCollision() {
  if (!doorBlock) return;

  cbContactPairResult.hasContact = false;

  physicsWorld.contactPairTest(
    playerBall.userData.physicsBody,
    doorBlock.userData.physicsBody,
    cbContactPairResult,
  );

  if (cbContactPairResult.hasContact && currentRoom === 1) {
    switchToRoom2();
  }
}

function blockHitsFloor() {
  if (!puzzleBlock) return;

  cbContactPairResult.hasContact = false;
  physicsWorld.contactPairTest(
    puzzleBlock.userData.physicsBody,
    groundBlock.userData.physicsBody,
    cbContactPairResult,
  );

  if (cbContactPairResult.hasContact) {
    checkBallHit = true;
    popUp = true;
    globalThis.alert("you have successfully knocked down the orange cube! :D");
    return;
  }

  if (!checkBallHit && numBalls === 0 && ballsUsed === totalBalls) {
    setTimeout(() => {
      if (checkBallHit) return;

      cbContactPairResult.hasContact = false;
      physicsWorld.contactPairTest(
        puzzleBlock.userData.physicsBody,
        groundBlock.userData.physicsBody,
        cbContactPairResult,
      );

      if (!cbContactPairResult.hasContact) {
        checkBallHit = true;
        globalThis.alert(
          "you have lost, you have not knocked down the orange cube and ran out of balls :(",
        );
      }

      popUp = true;
    }, 3000);
  }
}

export function shoot() {
  if (!canShoot.value || numBalls <= 0) return;

  const spawnPos = playerBall.position.clone().add(new THREE.Vector3(0, 5, 0)),
    radius = 1,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0x6b246e;

  const { ball: ball, body: body } = createBall(
    { x: spawnPos.x, y: spawnPos.y, z: spawnPos.z },
    radius,
    quat,
    mass,
    color,
  );
  physicsWorld.addRigidBody(body);

  raycaster.setFromCamera(mouseCoords, camera);
  const shootDirection = raycaster.ray.direction.clone().multiplyScalar(100);

  body.setLinearVelocity(
    new Ammo.btVector3(
      shootDirection.x,
      shootDirection.y,
      shootDirection.z,
    ),
  );

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);

  numBalls--;
  ballsUsed++;
  updateBallCounter();
}

function switchToRoom2() {
  currentRoom = 2;
  popUp = false;
  checkBallHit = false;

  for (let i = rigidBodies.length - 1; i >= 0; i--) {
    const obj = rigidBodies[i];
    if (obj !== playerBall) {
      scene.remove(obj);
      physicsWorld.removeRigidBody(obj.userData.physicsBody);
      rigidBodies.splice(i, 1);
    }
  }

  createRoom();

  puzzleBlock = null;
  puzzleBody = null;
  createPuzzleBox();
  playerBall.position.set(0, 20, 0);
  const transform = playerBody.getWorldTransform();
  transform.setOrigin(new Ammo.btVector3(0, 20, 0));
  playerBody.setWorldTransform(transform);

  console.log("Switched to room 2, balls owned: ", numBalls);
}
