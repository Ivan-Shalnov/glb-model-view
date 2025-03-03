import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/all";
gsap.registerPlugin(ScrollTrigger);
window.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll("canvas.webgl").forEach((canvas, idx) => {
    // if (idx !== 0) return;
    const modelPath = canvas.dataset.model;
    if (!modelPath) {
      console.error("Canvas не содержит data-model с путем к модели");
      return;
    }

    const scene = new THREE.Scene();

    // Рендерер с физически корректным освещением и ACESFilmic tone mapping
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      canvas: canvas,
      alpha: true,
    });
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.physicallyCorrectLights = true;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.CineonToneMapping;
    renderer.toneMappingExposure = 1.5;
    // Камера
    const camera = new THREE.PerspectiveCamera(
      45,
      canvas.clientWidth / canvas.clientHeight,
      0.25,
      200
    );
    camera.position.set(0, 15, 20);
    camera.lookAt(new THREE.Vector3(0, 0, 0));
    // gui.add(camera.position, "x");
    // gui.add(camera.position, "y");
    // gui.add(camera.position, "z");
    // // HDR окружение
    new RGBELoader()
      .setDataType(THREE.UnsignedByteType)
      .load(
        "https://cdn.jsdelivr.net/gh/mrdoob/three.js@master/examples/textures/equirectangular/royal_esplanade_1k.hdr",
        function (texture) {
          const pmremGenerator = new THREE.PMREMGenerator(renderer);
          pmremGenerator.compileEquirectangularShader();
          const envMap = pmremGenerator.fromEquirectangular(texture).texture;
          scene.environment = envMap;
          // scene.background = envMap; // можно включить, если нужен фон
          texture.dispose();
          pmremGenerator.dispose();
        }
      );

    // Загрузка модели
    const loader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();
    dracoLoader.setDecoderPath("https://www.gstatic.com/draco/v1/decoders/");
    loader.setDRACOLoader(dracoLoader);
    let model;
    let spinControl;
    loader.load(
      modelPath,
      (gltf) => {
        model = gltf.scene;
        model.scale.set(0.18, 0.18, 0.18);
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });
        scene.add(model);
        // spinControl = new SpinControls(model, 100, camera, renderer.domElement);
        gsap
          .timeline({
            scrollTrigger: {
              trigger: canvas,
              toggleActions: "play none none reverse",
              start: "center center",
              end: "bottom center",
              markers: true,
            },
          })
          .fromTo(
            camera.position,
            {
              y: 15,
              z: 20,
            },
            {
              z: 0,
              y: 25,
            },
            "<"
          )
          .to(model.scale, {
            x: 0.2, // Scale up 0.2x
            y: 0.2,
            z: 0.2,
            ease: "elastic.out(1, 0.5)", // Smooth bounce effect
          });
      },
      undefined,
      (error) => console.error("Ошибка загрузки GLB:", error)
    );

    const onHover = () => {
      gsap.to(model.rotation, {
        z: Math.PI,
        y: Math.PI,
        duration: 0.75, // Длительность анимации в секундах
        ease: "power2.out", // Плавное замедление
      });
    };
    const onLeave = () => {
      gsap.to(model.rotation, {
        z: 0,
        y: 0,
        duration: 0.75, // Длительность анимации в секундах
        ease: "power2.out", // Плавное замедление
      });
    };
    canvas.addEventListener("mouseenter", onHover);
    canvas.addEventListener("mouseleave", onLeave);
    // HemisphereLight для имитации неба и земли
    const hemiLight = new THREE.HemisphereLight(0xffffff, 0xffffff, 1.2);
    scene.add(hemiLight);

    // DirectionalLight (солнце) с настройками теней
    const sunLight = new THREE.DirectionalLight(0xffffff, 5);
    sunLight.position.set(10, 20, 10);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 4096;
    sunLight.shadow.mapSize.height = 4096;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -20;
    sunLight.shadow.camera.right = 20;
    sunLight.shadow.camera.top = 20;
    sunLight.shadow.camera.bottom = -20;
    sunLight.shadow.bias = -0.001;
    scene.add(sunLight);
    // const ambient = new THREE.AmbientLight(0xffffff, 1.5);
    // scene.add(ambient);
    // (Опционально: для отладки теней можно добавить помощника)
    // const helper = new THREE.CameraHelper(sunLight.shadow.camera);
    // scene.add(helper);

    // const spotLight = new THREE.SpotLight(0xffffff, 50);
    // spotLight.position.set(-7, 5, 5);
    // scene.add(spotLight);
    // const spotLight2 = new THREE.SpotLight(0xffffff, 50);
    // spotLight.position.set(7, 5, 0);
    // scene.add(spotLight2);
    // const spotLightHelper = new THREE.SpotLightHelper(spotLight);
    // scene.add(spotLightHelper);
    // Контролы
    // const controls = new OrbitControls(camera, renderer.domElement);
    // controls.minDistance = 2;
    // controls.maxDistance = 100;
    // controls.maxAzimuthAngle = Math.PI / 2;
    // controls.maxPolarAngle = Math.PI / 1;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 0.5;
    // controls.enableZoom = false;
    // controls.autoRotate = true;
    // controls.autoRotateSpeed = 0.5;
    // controls.update();
    function animate() {
      spinControl?.update();
      camera.lookAt(new THREE.Vector3(0, 0, 0));
      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }

    // gui.add(renderer, "toneMappingExposure").min(0).max(2).step(0.01);
    animate();

    function onResize() {
      camera.aspect = canvas.clientWidth / canvas.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(canvas.clientWidth, canvas.clientHeight);
    }
    window.addEventListener("resize", onResize);
  });
});
