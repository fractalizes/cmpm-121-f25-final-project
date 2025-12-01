import * as THREE from "https://cdn.jsdelivr.net/npm/three@0.164.1/build/three.module.js";
import {
  canShoot,
  clickEquipBalls,
  clickMovePlayer,
  shoot,
  updateAimTarget,
} from "./main.js";

export function initPhysicsWorld() {
  const collisionConfiguration = new Ammo.btDefaultCollisionConfiguration(),
    dispatcher = new Ammo.btCollisionDispatcher(collisionConfiguration),
    overlappingPairCache = new Ammo.btDbvtBroadphase(),
    solver = new Ammo.btSequentialImpulseConstraintSolver();

  const physicsWorld = new Ammo.btDiscreteDynamicsWorld(
    dispatcher,
    overlappingPairCache,
    solver,
    collisionConfiguration,
  );
  physicsWorld.setGravity(new Ammo.btVector3(0, -10, 0));

  return physicsWorld;
}

export function initGraphics() {
  const clock = new THREE.Clock();

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0xbfd1e5);

  const camera = new THREE.PerspectiveCamera(
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

  const d = 200;
  dirLight.shadow.camera.left = -d;
  dirLight.shadow.camera.right = d;
  dirLight.shadow.camera.top = d;
  dirLight.shadow.camera.bottom = -d;
  dirLight.shadow.camera.far = 13500;

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setClearColor(0xbfd1e5);
  renderer.setPixelRatio(globalThis.devicePixelRatio);
  renderer.setSize(globalThis.innerWidth, globalThis.innerHeight);
  document.body.appendChild(renderer.domElement);

  renderer.gammaInput = true;
  renderer.gammaOutput = true;
  renderer.shadowMap.enabled = true;

  return { scene, camera, renderer, clock };
}

export function initEventHandlers() {
  /*
  globalThis.addEventListener("keydown", handleKeyDown, false);
  globalThis.addEventListener("keyup", handleKeyUp, false);
  */

  globalThis.addEventListener("mousedown", (event) => {
    const equipped = clickEquipBalls(event);

    if (equipped) {
      canShoot.value = true;
      return;
    } else {
      clickMovePlayer(event);
    }
  }, false);

  globalThis.addEventListener("keydown", (event) => {
    if (event.code === "Space" && !event.repeat) {
      event.preventDefault(); // prevent page scroll
      shoot();
    }
  }, false);

  globalThis.addEventListener("mousemove", (event) => {
    updateAimTarget(event);
  });
}

export function initContactResultCallback() {
  const cbContactResult = new Ammo.ConcreteContactResultCallback();
  cbContactResult.addSingleResult = function (
    cp,
    _colObj0Wrap,
    _partId0,
    _index0,
    _colObj1Wrap,
    _partId1,
    _index1,
  ) {
    const contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);

    const distance = contactPoint.getDistance();
    if (distance > 0) return;

    /*
    const colWrapper0 = Ammo.wrapPointer(
      colObj0Wrap,
      Ammo.btCollisionObjectWrapper,
    );
    const rb0 = Ammo.castObject(
      colWrapper0.getCollisionObject(),
      Ammo.btRigidBody,
    );

    const colWrapper1 = Ammo.wrapPointer(
      colObj1Wrap,
      Ammo.btCollisionObjectWrapper,
    );
    const rb1 = Ammo.castObject(
      colWrapper1.getCollisionObject(),
      Ammo.btRigidBody,
    );

    console.log(rb0, rb1);
    */
  };
  return cbContactResult;
}

// checks for contact between two objects
export function initContactPairResultCallback() {
  const cbContactPairResult = new Ammo.ConcreteContactResultCallback();
  cbContactPairResult.hasContact = false;
  cbContactPairResult.addSingleResult = function (
    cp,
    _colObj0Wrap,
    _partId0,
    _index0,
    _colObj1Wrap,
    _partId1,
    _index1,
  ) {
    const contactPoint = Ammo.wrapPointer(cp, Ammo.btManifoldPoint);
    if (contactPoint.getDistance() > 0) return;

    this.hasContact = true;
  };
  return cbContactPairResult;
}
