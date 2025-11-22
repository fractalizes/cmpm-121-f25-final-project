// note: three helps with rendering, ammo helps with physics
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// https://medium.com/@bluemagnificent/moving-objects-in-javascript-3d-physics-using-ammo-js-and-three-js-6e39eff6d9e5
// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import {
  initEventHandlers,
  initGraphics,
  initPhysicsWorld,
} from "./initialization.js";

let physicsWorld, scene, camera, renderer, clock;
let tempTransformation = undefined;

const rigidBodies = [];
const colGroupPlane = 1, colGroupRedBall = 2, colGroupGreenBall = 4;
const STATE = { DISABLE_DEACTIVATION: 4 };

const cameraOffset = new THREE.Vector3(0, 20, 40);
const cameraSmoothness = 0.05;

let keys = {
  w: false,
  a: false,
  s: false,
  d: false,
};

Ammo().then(start);

function start() {
  tempTransformation = new Ammo.btTransform();

  // initialize everything
  physicsWorld = initPhysicsWorld();
  keys = initEventHandlers();
  const { scene: s, camera: c, renderer: r, clock: k } = initGraphics();
  scene = s, camera = c, renderer = r, clock = k;

  createBlock();
  createBall();

  renderFrame();
}

function renderFrame() {
  const deltaTime = clock.getDelta();
  updatePhysics(deltaTime);
  updateCameraFollow();
  renderer.render(scene, camera);

  requestAnimationFrame(renderFrame);
}

function createBlock() {
  const pos = { x: 0, y: 0, z: 0 },
    scale = { x: 500, y: 1, z: 500 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 0;

  const blockPlane = new THREE.Mesh(
    new THREE.BoxGeometry(scale.x, scale.y, scale.z),
    new THREE.MeshPhongMaterial({ color: 0xa0afa4 }),
  );

  blockPlane.position.set(pos.x, pos.y, pos.z);

  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;

  scene.add(blockPlane);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5),
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
  body.setFriction(4);
  body.setRollingFriction(10);

  physicsWorld.addRigidBody(body, colGroupPlane, colGroupRedBall);
}

function createBall() {
  const pos = { x: 0, y: 20, z: 0 },
    radius = 2,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1;

  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshPhongMaterial({ color: 0xff0505 }),
  );

  ball.position.set(pos.x, pos.y, pos.z);

  ball.castShadow = true;
  ball.receiveShadow = true;

  scene.add(ball);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
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
  body.setFriction(4);
  body.setRollingFriction(10);
  body.setActivationState(STATE.DISABLE_DEACTIVATION);

  physicsWorld.addRigidBody(
    body,
    colGroupRedBall,
    colGroupPlane | colGroupGreenBall,
  );

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);

  globalThis.playerBall = body;
}

function playerControls() {
  const acceleration = 80;
  const force = new Ammo.btVector3(0, 0, 0);

  if (keys.w) force.setZ(-acceleration);
  if (keys.s) force.setZ(acceleration);
  if (keys.a) force.setX(-acceleration);
  if (keys.d) force.setX(acceleration);

  globalThis.playerBall.applyCentralForce(force);
}

function updateCameraFollow() {
  if (!globalThis.playerBall) return;
  const ballPos = rigidBodies[0].position;

  const desiredPos = new THREE.Vector3(
    ballPos.x + cameraOffset.x,
    ballPos.y + cameraOffset.y,
    ballPos.z + cameraOffset.z,
  );

  camera.position.lerp(desiredPos, cameraSmoothness);

  camera.lookAt(ballPos);
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
  playerControls();
}

/*
// note: three helps with rendering, ammo helps with physics
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// https://medium.com/@bluemagnificent/moving-objects-in-javascript-3d-physics-using-ammo-js-and-three-js-6e39eff6d9e5
// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef

import {
  initEventHandlers,
  initGraphics,
  initPhysicsWorld,
} from "./initialization.js";

let physicsWorld, scene, camera, renderer, clock;
let tempTransformation = undefined;
let ballObj = null,
  moveDirection = { left: 0, right: 0, forward: 0, back: 0 };

const STATE = { DISABLE_DEACTIVATION: 4 };
const rigidBodies = [];

Ammo().then(start);

function start() {
  createBlock();
  createBall();

  renderFrame();
}

function renderFrame() {
  const deltaTime = clock.getDelta();
  moveBall();
  updatePhysics(deltaTime);
  renderer.render(scene, camera);

  requestAnimationFrame(renderFrame);
}
function createBlock() {
  const pos = { x: 0, y: 0, z: 0 },
    scale = { x: 100, y: 2, z: 100 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 0;

  //threeJS Section
  const blockPlane = new THREE.Mesh(
    new THREE.BoxGeometry(),
    new THREE.MeshPhongMaterial({ color: 0xa0afa4 }),
  );

  blockPlane.position.set(pos.x, pos.y, pos.z);
  blockPlane.scale.set(scale.x, scale.y, scale.z);

  blockPlane.castShadow = true;
  blockPlane.receiveShadow = true;

  scene.add(blockPlane);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
  const motionState = new Ammo.btDefaultMotionState(transform);

  const colShape = new Ammo.btBoxShape(
    new Ammo.btVector3(scale.x * 0.5, scale.y * 0.5, scale.z * 0.5),
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

  body.setFriction(4);
  body.setRollingFriction(10);

  physicsWorld.addRigidBody(body);
}

function createBall() {
  const pos = { x: 0, y: 4, z: 0 },
    radius = 2,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1;

  const ball = ballObj = new THREE.Mesh(
    new THREE.SphereGeometry(radius),
    new THREE.MeshPhongMaterial({ color: 0xff0505 }),
  );

  ball.position.set(pos.x, pos.y, pos.z);

  ball.castShadow = true;
  ball.receiveShadow = true;

  scene.add(ball);

  const transform = new Ammo.btTransform();
  transform.setIdentity();
  transform.setOrigin(new Ammo.btVector3(pos.x, pos.y, pos.z));
  transform.setRotation(new Ammo.btQuaternion(quat.x, quat.y, quat.z, quat.w));
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

  body.setFriction(4);
  body.setRollingFriction(10);
  body.setActivationState(STATE.DISABLE_DEACTIVATION);

  physicsWorld.addRigidBody(body);

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);
}

function moveBall() {
  const scalingFactor = 20;

  // y: vertical, z: horizontal
  const moveX = moveDirection.right - moveDirection.left;
  const moveZ = moveDirection.back - moveDirection.forward;
  const moveY = 0;

  if (moveX == 0 && moveY == 0 && moveZ == 0) return;

  const impulse = new Ammo.btVector3(moveX, moveY, moveZ);
  impulse.op_mul(scalingFactor);

  const physicsBody = ballObj.userData.physicsBody;
  physicsBody.setLinearVelocity(impulse);
}

function updatePhysics(deltaTime) {
  // advance a "step" in the world
  physicsWorld.stepSimulation(deltaTime, 10);

  // update rigid bodies
  for (let i = 0; i < rigidBodies.length; i++) {
    const objThree = rigidBodies[i];
    const objAmmo = objThree.userData.physicsBody;
    const motionState = objAmmo.getMotionState();

    if (motionState) {
      motionState.getWorldTransform(tempTransformation);
      const p = tempTransformation.getOrigin(),
        q = tempTransformation.getRotation();
      objThree.position.set(p.x(), p.y(), p.z());
      objThree.quaternion.set(q.x(), q.y(), q.z(), q.w());
    }
  }
}
*/
