// note: three helps with rendering, ammo helps with physics
// https://medium.com/@bluemagnificent/intro-to-javascript-3d-physics-using-ammo-js-and-three-js-dd48df81f591
// https://medium.com/@bluemagnificent/moving-objects-in-javascript-3d-physics-using-ammo-js-and-three-js-6e39eff6d9e5
// https://medium.com/@bluemagnificent/collision-detection-in-javascript-3d-physics-using-ammo-js-and-three-js-31a5569291ef

import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";

let physicsWorld, scene, camera, renderer, clock;
let tempTransformation = undefined;

const rigidBodies = [];
const colGroupPlane = 1, colGroupRedBall = 2, colGroupGreenBall = 4;

let cameraOffset = new THREE.Vector3(0, 20, 40);
let cameraSmoothness = 0.05;

const keys = {
  w: false,
  a: false,
  s: false,
  d: false,
}

window.addEventListener('keydown', (event) => {
  if (event.key in keys) {
    keys[event.key] = true;
  }
});

window.addEventListener('keyup', (event) => {
  if (event.key in keys) {
    keys[event.key] = false;
  }
});

Ammo().then(start);

function start() {
  tempTransformation = new Ammo.btTransform();

  // initialize everything
  initPhysicsWorld();
  initGraphics();

  createBlock();
  createBall();

  renderFrame();
}

function initPhysicsWorld() {
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    overlappingPairCache = new Ammo.btDbvtBroadphase(),
    solver = new Ammo.btSequentialImpulseConstraintSolver();

  physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration,
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));
}

function initGraphics() {
  clock = new THREE.Clock();

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  camera = new THREE.PerspectiveCamera(
    60,
    globalThis.innerWidth / globalThis.innerHeight,
    0.2,
    5000,
  );
  camera.position.set(0, 30, 70);
  camera.lookAt(new THREE.Vector3(0, 0, 0));

  const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 0.1);
  hemiLight.color.setHSL(0.6, 0.6, 0.6);
  hemiLight.groundColor.setHSL(0.1, 1, 0.4);
  hemiLight.position.set(0, 50, 0);
  scene.add(hemiLight);

  const dirLight = new THREE.DirectionalLight(0xffffff, 1);
  dirLight.color.setHSL(0.1, 1, 0.95);
  dirLight.position.set(-1, 1.75, 1);
  dirLight.position.multiplyScalar(100);
  scene.add(dirLight);
  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  const d = 50;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 13500;

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xbfd1e5);
  renderer.setPixelRatio(globalThis.devicePixelRatio);
  renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;

  renderer.shadowMap.enabled = true;
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
    scale = { x: 500, y: 1, z: 500},
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

  physicsWorld.addRigidBody(
    body,
    colGroupRedBall,
    colGroupPlane | colGroupGreenBall,
  );

  ball.userData.physicsBody = body;
  rigidBodies.push(ball);

  window.playerBall = body;
}

function playerControls() {
  const Maxspeed = 25;
  const acceleration = 80;
  const force = new Ammo.btVector3(0, 0, 0);

  if (keys.w) force.setZ(-acceleration);
  if (keys.s) force.setZ(acceleration);
  if (keys.a) force.setX(-acceleration);
  if (keys.d) force.setX(acceleration);

  window.playerBall.applyCentralForce(force);


}

function updateCameraFollow() {
  if (!window.playerBall) return;

  const ballPos = rigidBodies[0].position;

  const desiredPos = new THREE.Vector3(
    ballPos.x + cameraOffset.x,
    ballPos.y + cameraOffset.y,
    ballPos.z + cameraOffset.z
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
