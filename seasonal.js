import * as THREE from "three";

import {
    GLTFLoader
} from
"three/addons/loaders/GLTFLoader.js";

import {
    MeshoptDecoder
} from
"three/addons/libs/meshopt_decoder.module.js";



/* ========================================================
   PRODUCT DATA
======================================================== */

const products =
    [...document.querySelectorAll(".product-item")];



/* ========================================================
   THREE.JS SETTINGS
======================================================== */

const settings = {

    /* --- card fit: models are sized from their own bounding box --- */
    fitWidth: .92,      /* share of the card width a spinning model may use */
    fitHeight: .8,      /* share of the card's height band a model may use */
    headroom: .04,      /* world units kept free at the top of the canvas */
    groundY: -.58,      /* world y of the card's contact-shadow line */
    hoverScale: 1.07,   /* hover grow, kept inside the fit margins */

    /* --- motion (stays inside the fit margins) --- */
    idleRotation: 0.0018,

    hoverRotation: 0.003,

    floatAmount: 0.055,

    floatSpeed: 0.0015,

    maxPixelRatio: 1.7

};



/* ========================================================
   LOADER
======================================================== */

const loader =
    new GLTFLoader();

loader.setMeshoptDecoder(
    MeshoptDecoder
);



/* ========================================================
   MODEL STORAGE
======================================================== */

const scenes =
    new Map();



/* ========================================================
   CARD FIT HELPERS
======================================================== */

/* The world-space band a card canvas shows, read straight off
   its own camera, so the fit follows the real card size at
   every breakpoint. */
function visibleBand(camera) {

    const distance =
        Math.abs(camera.position.z);


    const viewHeight =
        2 *
        Math.tan(
            THREE.MathUtils.degToRad(camera.fov) / 2
        ) *
        distance;


    const aspect =
        Number.isFinite(camera.aspect) && camera.aspect > 0
            ? camera.aspect
            : 1;


    return {

        width: viewHeight * aspect,

        top:
            camera.position.y +
            viewHeight / 2 -
            settings.headroom,

        bottom: settings.groundY

    };

}


/* Vertical centre of the card band - the y every model floats around. */
function bandCentre(camera) {

    const band =
        visibleBand(camera);

    return (band.top + band.bottom) / 2;

}


/* Scale a model so its whole bounding box fits the card: height
   against the card band, width against the widest silhouette it
   shows while spinning. Nothing is ever cropped, whatever the
   GLB's proportions or the card width. */
function fitModelToCard(camera, model, size, nudge) {

    const band =
        visibleBand(camera);


    const bandHeight =
        band.top - band.bottom;


    const silhouette =
        Math.max(size.x, size.z);


    const scale =
        (size.y > 0 && silhouette > 0)
            ? Math.min(
                (bandHeight * settings.fitHeight) / size.y,
                (band.width * settings.fitWidth) / silhouette
            ) * nudge
            : nudge;


    model.scale.setScalar(scale);

    return scale;

}



/* ========================================================
   CREATE THREE.JS SCENE
======================================================== */

function createScene(product) {


    const container =
        product.querySelector(".model-container");


    /* -----------------------------------------------
       SCENE
    ------------------------------------------------ */

    const scene =
        new THREE.Scene();



    /* -----------------------------------------------
       CAMERA
    ------------------------------------------------ */

    const camera =
        new THREE.PerspectiveCamera(

            35,

            container.clientWidth /
            container.clientHeight,

            0.1,

            100

        );


    camera.position.set(
        0,
        0.15,
        3.4
    );

    camera.lookAt(
        0,
        0,
        0
    );



    /* -----------------------------------------------
       RENDERER
    ------------------------------------------------ */

    const renderer =
        new THREE.WebGLRenderer({

            alpha: true,

            antialias: true,

            powerPreference:
                "high-performance"

        });


    renderer.setPixelRatio(

        Math.min(
            window.devicePixelRatio,
            settings.maxPixelRatio
        )

    );


    renderer.setSize(

        container.clientWidth,
        container.clientHeight,

        false

    );


    renderer.outputColorSpace =
        THREE.SRGBColorSpace;


    renderer.toneMapping =
        THREE.ACESFilmicToneMapping;


    renderer.toneMappingExposure =
        1.15;


    renderer.shadowMap.enabled = true;


    renderer.shadowMap.type =
        THREE.PCFSoftShadowMap;


    container.appendChild(
        renderer.domElement
    );



    /* ==================================================
       LIGHTING
    ================================================== */

    const hemisphereLight =
        new THREE.HemisphereLight(

            0xffffff,

            0x77805e,

            2.3

        );


    scene.add(
        hemisphereLight
    );



    const keyLight =
        new THREE.DirectionalLight(

            0xffffff,

            3

        );


    keyLight.position.set(
        3,
        5,
        5
    );


    keyLight.castShadow = true;


    scene.add(
        keyLight
    );



    const fillLight =
        new THREE.DirectionalLight(

            0xe6efd1,

            1.7

        );


    fillLight.position.set(
        -4,
        2,
        3
    );


    scene.add(
        fillLight
    );



    const rimLight =
        new THREE.PointLight(

            0xc8d89b,

            2.5,
            10

        );


    rimLight.position.set(
        0,
        3,
        -2
    );


    scene.add(
        rimLight
    );



    /* ==================================================
       STATE
    ================================================== */

    const state = {

        model: null,

        targetRotationX: 0,

        targetRotationY: 0,

        currentRotationX: 0,

        currentRotationY: 0,

        scrollTilt: 0,

        hovered: false,

        mouseX: 0,

        mouseY: 0,

        startTime:
            performance.now(),

        rawSize: null,

        nudge: 1,

        fitScale: 1,

        baselineY: bandCentre(camera),

        hoverAmount: 1,

        loaded: false

    };



    /* ==================================================
       REFIT
    ================================================== */

    /* Re-fit the model and its baseline to the current card size. */
    function refit() {

        state.baselineY =
            bandCentre(camera);


        if (state.model && state.rawSize) {

            state.fitScale =
                fitModelToCard(
                    camera,
                    state.model,
                    state.rawSize,
                    state.nudge
                );

        }

    }


    /* ==================================================
       RESIZE
    ================================================== */

    function resize() {

        const width =
            container.clientWidth;

        const height =
            container.clientHeight;


        if (
            width === 0 ||
            height === 0
        ) return;


        camera.aspect =
            width / height;


        camera.updateProjectionMatrix();


        renderer.setSize(
            width,
            height,
            false
        );


        refit();

    }


    const resizeObserver =
        new ResizeObserver(
            resize
        );


    resizeObserver.observe(
        container
    );


    resize();


    /* Scroll progress adds a gentle tilt without moving models off-center. */
    function updateScrollMotion() {

        const rect =
            product.getBoundingClientRect();

        const distanceFromCenter =
            (window.innerHeight * .5 -
                (rect.top + rect.height * .5)) /
            window.innerHeight;

        const progress =
            Math.max(-1, Math.min(1, distanceFromCenter));

        state.scrollTilt =
            progress * .08;

    }


    updateScrollMotion();

    window.addEventListener(
        "scroll",
        updateScrollMotion,
        { passive: true }
    );



    /* ==================================================
       MOUSE MOVE
    ================================================== */

    container.addEventListener(
        "pointermove",
        event => {

            const rect =
                container.getBoundingClientRect();


            const x =
                (
                    event.clientX -
                    rect.left
                ) / rect.width;


            const y =
                (
                    event.clientY -
                    rect.top
                ) / rect.height;


            state.mouseX =
                (x - .5) * 2;


            state.mouseY =
                (y - .5) * 2;


            state.targetRotationY =
                state.mouseX * .35;


            state.targetRotationX =
                state.mouseY * .18;

        }
    );



    /* ==================================================
       POINTER ENTER
    ================================================== */

    container.addEventListener(
        "pointerenter",
        () => {

            state.hovered = true;

        }
    );



    /* ==================================================
       POINTER LEAVE
    ================================================== */

    container.addEventListener(
        "pointerleave",
        () => {

            state.hovered = false;

            state.targetRotationX = 0;

            state.targetRotationY = 0;

        }
    );



    /* ==================================================
       ANIMATION
    ================================================== */

    function animate() {

        if (!state.loaded) {

            requestAnimationFrame(
                animate
            );

            return;

        }


        const elapsed =
            performance.now() -
            state.startTime;



        /* ---------------------------------------------
           IDLE ROTATION
        --------------------------------------------- */

        state.model.rotation.y +=
            state.hovered
                ? settings.hoverRotation
                : settings.idleRotation;



        /* ---------------------------------------------
           SMOOTH MOUSE ROTATION
        --------------------------------------------- */

        state.currentRotationX +=

            (
                state.targetRotationX -
                state.currentRotationX
            ) * .08;


        state.currentRotationY +=

            (
                state.targetRotationY -
                state.currentRotationY
            ) * .08;



        state.model.rotation.x =
            state.currentRotationX +
            state.scrollTilt;


        state.model.rotation.y +=
            state.currentRotationY * .02;



        /* ---------------------------------------------
           FLOATING
        --------------------------------------------- */

        state.model.position.y =
            state.baselineY +
            Math.sin(
                elapsed *
                settings.floatSpeed
            ) *
            settings.floatAmount;



        /* ---------------------------------------------
           HOVER SCALE
        --------------------------------------------- */

        /* Hover grow multiplies the fitted scale, so the model can
           never drift away from the size that fits the card. */
        const targetScale =
            state.hovered
                ? settings.hoverScale
                : 1;


        state.hoverAmount +=
            (targetScale - state.hoverAmount) * .07;


        state.model.scale.setScalar(
            state.fitScale * state.hoverAmount
        );



        /* ---------------------------------------------
           RENDER
        --------------------------------------------- */

        renderer.render(
            scene,
            camera
        );


        requestAnimationFrame(
            animate
        );

    }


    animate();



    /* ==================================================
       RETURN
    ================================================== */

    return {

        scene,

        camera,

        renderer,

        state,

        resizeObserver,

        refit

    };

}



/* ========================================================
   LOAD MODEL
======================================================== */

function loadModel(product) {


    if (
        scenes.has(product)
    ) return;


    const sceneData =
        createScene(product);


    scenes.set(
        product,
        sceneData
    );


    const modelPath =
        product.dataset.model;


    const loading =
        product.querySelector(
            ".model-loading"
        );



    loader.load(

        modelPath,


        gltf => {

            const model =
                gltf.scene;



            /* -----------------------------------------
               MATERIAL / SHADOW SETTINGS
            ----------------------------------------- */

            model.traverse(
                child => {

                    if (
                        child.isMesh
                    ) {

                        child.castShadow =
                            true;

                        child.receiveShadow =
                            true;


                        const tint =
                            product.dataset.tint;

                        const materials =
                            Array.isArray(child.material)
                                ? child.material
                                : [child.material];

                        materials.forEach(
                            material => {

                                if (
                                    material &&
                                    material.color &&
                                    tint
                                ) {

                                    material.color.set(tint);

                                }

                                if (material) {

                                    material.needsUpdate =
                                        true;

                                }

                            }
                        );

                    }

                }
            );



            /* -----------------------------------------
               CENTER MODEL
            ----------------------------------------- */

            const box =
                new THREE.Box3()
                    .setFromObject(model);


            const size =
                box.getSize(
                    new THREE.Vector3()
                );


            const center =
                box.getCenter(
                    new THREE.Vector3()
                );


            model.position.set(
                -center.x,
                -center.y,
                -center.z
            );



            /* -----------------------------------------
               FIT TO CARD
               The scale comes from the card's own camera
               band, so nothing is cropped at any breakpoint.
               Optional per-card nudge: data-scale="1.1"
            ----------------------------------------- */

            const nudgeAttr =
                parseFloat(
                    product.dataset.scale
                );


            const pivot =
                new THREE.Group();

            pivot.add(
                model
            );

            pivot.position.set(
                0,
                0,
                0
            );

            sceneData.state.rawSize =
                size;


            sceneData.state.nudge =
                isNaN(nudgeAttr) ? 1 : nudgeAttr;



            /* -----------------------------------------
               ADD MODEL
            ----------------------------------------- */

            sceneData.scene.add(
                pivot
            );


            sceneData.state.model =
                pivot;


            sceneData.refit();


            sceneData.state.loaded =
                true;



            /* -----------------------------------------
               HIDE LOADER
            ----------------------------------------- */

            if (loading) {

                loading.classList.add(
                    "hidden"
                );

            }

        },


        xhr => {

            if (
                xhr.total
            ) {

                const percent =
                    (
                        xhr.loaded /
                        xhr.total
                    ) * 100;

                console.log(

                    product.dataset.model,

                    Math.round(percent) + "%"

                );

            }

        },


        error => {

            console.error(
                "Could not load model:",
                modelPath,
                error
            );


            if (loading) {

                loading.classList.add(
                    "hidden"
                );

            }

        }

    );

}



/* ========================================================
   LAZY LOAD GLBs
======================================================== */

const observer =
    new IntersectionObserver(

        entries => {

            entries.forEach(
                entry => {

                    if (
                        entry.isIntersecting
                    ) {

                        entry.target.classList.add(
                            "is-visible"
                        );

                        loadModel(
                            entry.target
                        );


                        observer.unobserve(
                            entry.target
                        );

                    }

                }
            );

        },

        {

            rootMargin:
                "300px 0px"

        }

    );



products.forEach(
    product => {

        observer.observe(
            product
        );

    }
);

/* ========================================================
   CLEANUP
======================================================== */

window.addEventListener(
    "beforeunload",
    () => {

        scenes.forEach(
            sceneData => {

                sceneData.resizeObserver
                    .disconnect();


                sceneData.scene.traverse(
                    object => {

                        if (
                            object.isMesh
                        ) {

                            if (
                                object.geometry
                            ) {

                                object.geometry
                                    .dispose();

                            }


                            if (
                                object.material
                            ) {

                                if (
                                    Array.isArray(
                                        object.material
                                    )
                                ) {

                                    object.material
                                        .forEach(
                                            material =>
                                                material.dispose()
                                        );

                                } else {

                                    object.material
                                        .dispose();

                                }

                            }

                        }

                    }
                );


                sceneData.renderer.dispose();

            }
        );

    }
);
/* ========================================================
   SCROLL-CONTROLLED BACKGROUND VIDEO
   The video does not play by itself: scrolling down moves
   it forward, scrolling up moves it backward.
======================================================== */

(function () {

    const video =
        document.querySelector(".page-background-video");

    const seasonItems =
        [...document.querySelectorAll(".season-progress-item")];

    if (!video) return;

    const reducedMotion =
        window.matchMedia("(prefers-reduced-motion: reduce)");

    const smoothing =
        window.matchMedia("(max-width: 650px)").matches
            ? 0.045
            : 0.035;

    const maxStep =
        window.matchMedia("(max-width: 650px)").matches
            ? 0.014
            : 0.018;

    let target = 0;           /* scroll progress, 0 to 1 */
    let current = 0;          /* smoothed progress */
    let activeSeason = -1;
    let targetUpdateQueued = false;

    video.pause();

    function setSeason(index) {

        if (index === activeSeason)
            return;

        activeSeason = index;

        seasonItems.forEach(
            (item, itemIndex) => {
                item.classList.toggle(
                    "is-active",
                    itemIndex === index
                );
            }
        );

    }

    function updateTarget() {

        const max =
            document.documentElement.scrollHeight -
            window.innerHeight;

        target =
            max > 0
                ? Math.min(1, Math.max(0, window.scrollY / max))
                : 0;

        setSeason(
            Math.min(3, Math.floor(target * 4))
        );

    }


    function queueTargetUpdate() {

        if (targetUpdateQueued)
            return;

        targetUpdateQueued = true;

        requestAnimationFrame(() => {

            updateTarget();
            targetUpdateQueued = false;

        });

    }

    function tick() {

        const distance = target - current;
        const easedStep = distance * smoothing;
        const step = Math.sign(easedStep) *
            Math.min(Math.abs(easedStep), maxStep);

        current += step;

        if (!reducedMotion.matches && video.duration) {

            const time =
                current * video.duration;

            /* only seek when the change is big enough to matter */
            if (Math.abs(video.currentTime - time) > 1 / 60) {

                video.currentTime = time;

            }

        }

        requestAnimationFrame(tick);

    }

    window.addEventListener("scroll", queueTargetUpdate, { passive: true });
    window.addEventListener("resize", queueTargetUpdate);

    video.addEventListener(
        "play",
        () => video.pause()
    );

    video.addEventListener("loadedmetadata", () => {

        video.pause();

        if (reducedMotion.matches) {
            current = 0;
            video.currentTime = 0;
        }

        updateTarget();

    });

    reducedMotion.addEventListener?.(
        "change",
        () => {

            video.pause();

            if (reducedMotion.matches) {
                current = 0;
                video.currentTime = 0;
            }

        }
    );

    updateTarget();
    tick();

})();