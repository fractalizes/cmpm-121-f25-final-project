// note: three helps with rendering, ammo helps with physics
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// https://medium.com/@bluemagnificent/moving-objects-in-javascript-3d-physics-using-ammo-js-and-three-js-6e39eff6d9e5
// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import {
  initGraphics,
  initMovement,
  initPhysicsWorld,
} from "./initialization.js";

let physicsWorld, scene, camera, renderer, clock;
let tempTransformation = undefined;
let playerBall = null,
  playerBody = null,
  keys = {
    w: false,
    a: false,
    s: false,
    d: false,
  };

const rigidBodies = [];
const mouseCoords = new THREE.Vector2(),
  raycaster = new THREE.Raycaster(),
  tempPos = new THREE.Vector3();

const STATE = { DISABLE_DEACTIVATION: 4 };
const FLAGS = { CF_KINEMATIC_OBJ: 2 };

const cameraOffset = new THREE.Vector3(0, 20, 40);
const cameraSmoothness = 0.05;

Ammo().then(start);

function start() {
  tempTransformation = new Ammo.btTransform();

  // initialize everything
  physicsWorld = initPhysicsWorld();
  keys = initMovement();
  const { scene: s, camera: c, renderer: r, clock: k } = initGraphics();
  scene = s, camera = c, renderer = r, clock = k;

  createGround();
  createPlayer();
  createKinematicBox();

  renderFrame();
}

function renderFrame() {
  const deltaTime = clock.getDelta();

  movePlayer();

  updatePhysics(deltaTime);
  updateCameraFollow();

  renderer.render(scene, camera);

  // recursion to keep updating every frame
  requestAnimationFrame(renderFrame);
}

function createGround() {
  const pos = { x: 0, y: 0, z: 0 },
    scale = { x: 500, y: 1, z: 500 },
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 0,
    color = 0xa0afa4;

  const { body: body } = createBlock(pos, scale, quat, mass, color);

  body.setFriction(4);
  body.setRollingFriction(10);
  physicsWorld.addRigidBody(body);
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

  const { block: kineBox, body: body } = createBlock(
    pos,
    scale,
    quat,
    mass,
    color,
  );

  body.setActivationState(STATE.DISABLE_DEACTIVATION);
  body.setCollisionFlags(FLAGS.CF_KINEMATIC_OBJ);

  physicsWorld.addRigidBody(body);
  kineBox.userData.physicsBody = body;

  return { kineBox, body };
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

function movePlayer() {
  if (!playerBody) return;

  const acceleration = 80;
  const force = new Ammo.btVector3(0, 0, 0);

  if (keys.w) force.setZ(-acceleration);
  if (keys.s) force.setZ(acceleration);
  if (keys.a) force.setX(-acceleration);
  if (keys.d) force.setX(acceleration);

  playerBody.applyCentralForce(force);
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

// "shoot" button (mouse1 down)
globalThis.addEventListener("mousedown", (event) => {
  mouseCoords.set(
    (event.clientX / globalThis.innerWidth) * 2 - 1,
    -(event.clientY / globalThis.innerHeight) * 2 + 1,
  );

  raycaster.setFromCamera(mouseCoords, camera);

  tempPos.copy(raycaster.ray.direction);
  tempPos.add(raycaster.ray.origin);

  const pos = { x: tempPos.x, y: tempPos.y, z: tempPos.z },
    radius = 1,
    quat = { x: 0, y: 0, z: 0, w: 1 },
    mass = 1,
    color = 0x6b246e;

  const { ball: ball, body: body } = createBall(pos, radius, quat, mass, color);
  physicsWorld.addRigidBody(body);

  tempPos.copy(raycaster.ray.direction);
  tempPos.multiplyScalar(100);

  body.setLinearVelocity(new Ammo.btVector3(tempPos.x, tempPos.y, tempPos.z));

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);
});
