import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import gsap from 'gsap';

export default function BookBackground() {
  const mountRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    // WebGL Support Check
    const isWebGLAvailable = () => {
      try {
        const canvas = document.createElement('canvas');
        return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
      } catch (e) {
        return false;
      }
    };

    if (!isWebGLAvailable()) {
      console.warn('WebGL not supported, skipping 3D background.');
      return;
    }

    let renderer;
    try {
      // Renderer
      renderer = new THREE.WebGLRenderer({
        canvas: canvasRef.current as HTMLCanvasElement,
        alpha: true,
        antialias: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.setClearColor(0x000000, 0);
    } catch (e) {
      console.error('Failed to initialize WebGL renderer:', e);
      return;
    }

    // Scene
    const scene = new THREE.Scene();

    // Camera
    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 2, 6);
    camera.lookAt(0, 0, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0xF2F0E9, 0.6);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xF2F0E9, 0.8);
    directionalLight.position.set(5, 10, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    const pointLight = new THREE.PointLight(0xCC5833, 0.3);
    pointLight.position.set(-3, 3, 3);
    scene.add(pointLight);

    // Book Group
    const bookGroup = new THREE.Group();
    scene.add(bookGroup);

    // Materials
    const coverMaterial = new THREE.MeshStandardMaterial({
      color: 0xF2F0E9,
      roughness: 0.6,
      metalness: 0.05,
    });
    const spineMaterial = new THREE.MeshStandardMaterial({
      color: 0x2E4036,
      roughness: 0.7,
    });
    const pageMaterial = new THREE.MeshStandardMaterial({
      color: 0xEDE9DF,
      roughness: 0.85,
      metalness: 0,
    });

    // Spine
    const spineGeometry = new THREE.BoxGeometry(0.3, 3, 2);
    const spine = new THREE.Mesh(spineGeometry, spineMaterial);
    bookGroup.add(spine);

    // Pivot Groups for animation
    const leftPivot = new THREE.Group();
    const rightPivot = new THREE.Group();
    bookGroup.add(leftPivot, rightPivot);

    // Covers
    const coverGeometry = new THREE.BoxGeometry(3, 3, 0.08);
    const leftCover = new THREE.Mesh(coverGeometry, coverMaterial);
    leftCover.position.set(-1.5, 0, 0);
    leftPivot.add(leftCover);

    const rightCover = new THREE.Mesh(coverGeometry, coverMaterial);
    rightCover.position.set(1.5, 0, 0);
    rightPivot.add(rightCover);

    // Set resting angle
    leftPivot.rotation.y = THREE.MathUtils.degToRad(-20);
    rightPivot.rotation.y = THREE.MathUtils.degToRad(20);

    // Pages
    const pageGeometry = new THREE.PlaneGeometry(2.9, 2.85);
    const pages = [];
    const numPages = 6;
    const pageTimeline = gsap.timeline({ repeat: -1 });

    for (let i = 0; i < numPages; i++) {
      const pagePivot = new THREE.Group();
      bookGroup.add(pagePivot);
      
      const page = new THREE.Mesh(pageGeometry, pageMaterial);
      page.position.set(1.45, 0, 0.01 * (i + 1));
      page.rotation.y = 0;
      page.castShadow = true;
      page.receiveShadow = true;
      
      pagePivot.add(page);
      pagePivot.rotation.y = 0; // Starts on the right
      pages.push(pagePivot);

      // Add flip animation to timeline
      pageTimeline.to(pagePivot.rotation, {
        y: -Math.PI, // Flip to the left
        duration: 1.8,
        ease: "power2.inOut",
        onUpdate: function() {
          const progress = this.progress();
          // Slight Z sag mid-flip
          if (progress < 0.5) {
            page.rotation.z = THREE.MathUtils.degToRad(progress * 30);
          } else {
            page.rotation.z = THREE.MathUtils.degToRad((1 - progress) * 30);
          }
        }
      }, i * 2.5);
    }

    // Scroll listener for opacity
    const handleScroll = () => {
      const scroll = window.scrollY;
      const heroHeight = 800; // Adjust based on layout
      let opacity = 0;

      if (scroll < 300) {
        opacity = (scroll / 300) * 0.18;
      } else if (scroll < heroHeight + 500) {
        opacity = 0.18;
      } else {
        opacity = Math.max(0, 0.18 - ((scroll - (heroHeight + 500)) / 300) * 0.18);
      }

      if (mountRef.current) {
        (mountRef.current as HTMLDivElement).style.opacity = opacity.toString();
      }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll();

    // Resize
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    // Animate
    const clock = new THREE.Clock();
    const animate = () => {
      const time = clock.getElapsedTime();

      // Idle animation
      bookGroup.position.y = Math.sin(time * 0.4) * 0.08;
      bookGroup.rotation.y = Math.sin(time * 0.2) * 0.1;

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
      renderer.dispose();
      pageTimeline.kill();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        pointerEvents: 'none',
        opacity: 0,
        transition: 'opacity 0.5s ease',
      }}
    >
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%' }} />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 30%, #F2F0E9 75%)',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
