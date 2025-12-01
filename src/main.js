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
// ---          VARIABLES          --- //
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

const STATE = { DISABLE_DEACTIVATION: 4 };
const FLAGS = { CF_KINEMATIC_OBJ: 2 };

const cameraOffset = new THREE.Vector3(0, 20, 40);
const cameraSmoothness = 0.05;

const equippableBalls = [];
export const canShoot = { value: false };
canShoot.value = false;
export let numBalls = 0;
const totalBalls = 8;

let checkBallHit = false;

// ----------------------------------- //
// ---         UI ELEMENTS         --- //
// ----------------------------------- //

const ballCounterDiv = document.getElementById("ballCounter");

function updateBallCounter() {
  ballCounterDiv.textContent = "Balls: " + numBalls;
}

// initialize ammo
Ammo().then(start);

function start() {
  tempTransformation = new Ammo.btTransform();

  // initialize ammo environment configurations
  physicsWorld = initPhysicsWorld();
  const { scene: s, camera: c, renderer: r, clock: k } = initGraphics();
  scene = s, camera = c, renderer = r, clock = k;
  initEventHandlers();

  createGround();
  createPlayer();
  createKinematicBox();

  createEquippableBalls();
  createRoom();
  createDoor();
  updateBallCounter();

  cbContactResult = initContactResultCallback();
  cbContactPairResult = initContactPairResultCallback();

  renderFrame();
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
// ---      GAMEWORLD OBJECTS      --- //
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
  const roomSize = 500;
  const wallHeight = 80;
  const wallThickness = 5;

  {
    const pos = { x: -roomSize / 2, y: wallHeight / 2, z: 0 };
    const scale = { x: wallThickness, y: wallHeight, z: roomSize };
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;
    const color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    body.setFriction(4);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: roomSize / 2, y: wallHeight / 2, z: 0 };
    const scale = { x: wallThickness, y: wallHeight, z: roomSize };
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;
    const color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    body.setFriction(4);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: 0, y: wallHeight / 2, z: -roomSize / 2 };
    const scale = { x: roomSize, y: wallHeight, z: wallThickness };
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;
    const color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    body.setFriction(4);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }

  {
    const pos = { x: 0, y: wallHeight / 2, z: roomSize / 2 };
    const scale = { x: roomSize, y: wallHeight, z: wallThickness };
    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;
    const color = 0x444444;

    const { block, body } = createBlock(pos, scale, quat, mass, color);
    body.setFriction(4);
    physicsWorld.addRigidBody(body);
    block.userData.physicsBody = body;
  }
}

function createDoor() {
  const pos = { x: 0, y: 20, z: -245 };
  const scale = { x: 30, y: 40, z: 5 };
  const quat = { x: 0, y: 0, z: 0, w: 1 };
  const mass = 0;
  const color = 0x2244ff;

  const { block, body } = createBlock(pos, scale, quat, mass, color);
  doorBlock = block;
  doorBlock.userData.physicsBody = body;
  physicsWorld.addRigidBody(body);
  rigidBodies.push(block);
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

function createEquippableBalls() {
  const numEquipBalls = 8;
  const radius = 2;
  const height = 3;
  const color = 0x00aaff;

  const roomSize = 500;
  const wallPadding = 20;

  for (let i = 0; i < numEquipBalls; i++) {
    const angle = (i / numEquipBalls) * Math.PI * 2;

    const r = (roomSize / 2) - wallPadding;

    const x = Math.cos(angle) * r;
    const z = Math.sin(angle) * r;
    const pos = { x, y: height, z };

    const quat = { x: 0, y: 0, z: 0, w: 1 };
    const mass = 0;

    const { ball, body } = createBall(pos, radius, quat, mass, color);

    physicsWorld.addRigidBody(body);
    ball.userData.physicsBody = body;

    equippableBalls.push(ball);
    rigidBodies.push(ball);
  }
}

// ----------------------------------- //
// ---       CORE GAME LOGIC       --- //
// ----------------------------------- //

function movePlayer() {
  if (!playerBody || !playerBall || !moveTarget) return;

  const currentPos = playerBall.position;
  const direction = moveTarget.clone().sub(currentPos).setY(0);

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

  const desiredPos = new THREE.Vector3(
    ballPos.x + cameraOffset.x,
    ballPos.y + cameraOffset.y,
    ballPos.z + cameraOffset.z,
  );

  camera.position.lerp(desiredPos, cameraSmoothness);
  camera.lookAt(ballPos);
}

export function clickEquipBalls(event) {
  mouseCoords.set(
    (event.clientX / globalThis.innerWidth) * 2 - 1,
    -(event.clientY / globalThis.innerHeight) * 2 + 1,
  );
  raycaster.setFromCamera(mouseCoords, camera);

  const hit = raycaster.intersectObjects(equippableBalls, true);

  if (hit.length > 0) {
    const clicked = hit[0].object;
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

  return false;
}

export function updateAimTarget(event) {
  mouseCoords.set(
    (event.clientX / globalThis.innerWidth) * 2 - 1,
    -(event.clientY / globalThis.innerHeight) * 2 + 1,
  );
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
  mouseCoords.set(
    (event.clientX / globalThis.innerWidth) * 2 - 1,
    -(event.clientY / globalThis.innerHeight) * 2 + 1,
  );
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
  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objAmmo = objThree.userData.physicsBody;
    const ms = objAmmo.getMotionState();

    if (ms) {
      ms.getWorldTransform(tempTransformation);
      const p = tempTransformation.getOrigin(),
        q = tempTransformation.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}

// checks for contact between any object
function checkContact() {
  physicsWorld.contactTest(playerBall.userData.physicsBody, cbContactResult);
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

  const pos = { x: aimTarget.x, y: aimTarget.y, z: aimTarget.z },
    radius = 1,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0x6b246e;

  const { ball: ball, body: body } = createBall(pos, radius, quat, mass, color);
  physicsWorld.addRigidBody(body);

  aimTarget.copy(raycaster.ray.direction);
  aimTarget.multiplyScalar(100);

  body.setLinearVelocity(
    new Ammo.btVector3(aimTarget.x, aimTarget.y, aimTarget.z),
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
