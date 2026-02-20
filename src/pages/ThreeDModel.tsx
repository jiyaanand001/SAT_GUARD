import { useEffect, useRef, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Info, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

export default function ThreeDModel() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [terrainData, setTerrainData] = useState<any>(null);

  const detectionId = searchParams.get('detection_id') || '';
  const lat = searchParams.get('lat') || '0';
  const lng = searchParams.get('lng') || '0';
  const area = searchParams.get('area') || '0';
  const severity = searchParams.get('severity') || 'High';
  const imageUrl = searchParams.get('image_url') || '';

  const generateTerrainFromDetection = () => {
    const seed = detectionId ? parseInt(detectionId) : Date.now();
    const latInfluence = parseFloat(lat) % 10;
    const lngInfluence = parseFloat(lng) % 10;
    const areaInfluence = parseFloat(area);
    return {
      seed,
      craterDepth: 1.5 + areaInfluence * 0.2,
      craterRadius: Math.max(1.5, areaInfluence * 0.8),
      roughness: 0.3 + latInfluence * 0.05,
      erosionPattern: lngInfluence > 5 ? 'radial' : 'linear',
      machineryCount: Math.max(1, Math.floor(areaInfluence / 2) + 1),
      debrisCount: Math.floor(areaInfluence * 5) + 10,
      excavationShape: severity === 'Critical' ? 'deep' : 'shallow',
    };
  };

  const analyzeImage = (url: string, onProgress: (p: number) => void): Promise<{ heightMap: number[][] }> => {
    onProgress(20);
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, 64, 64);
        const imageData = ctx?.getImageData(0, 0, 64, 64);
        const pixels = imageData?.data;
        if (!pixels) { resolve({ heightMap: [] }); return; }
        const heightMap: number[][] = [];
        for (let y = 0; y < 64; y++) {
          const row: number[] = [];
          for (let x = 0; x < 64; x++) {
            const i = (y * 64 + x) * 4;
            const brightness = (pixels[i] + pixels[i + 1] + pixels[i + 2]) / 3;
            row.push((brightness / 255) * 2 - 1);
          }
          heightMap.push(row);
        }
        onProgress(50);
        resolve({ heightMap });
      };
      img.onerror = () => resolve({ heightMap: [] });
      img.src = url;
    });
  };

  useEffect(() => {
    if (!canvasRef.current) return;

    let animId: number;
    let renderer: THREE.WebGLRenderer;

    const initializeScene = async () => {
      setLoadingProgress(10);

      let imageAnalysis: { heightMap: number[][] } = { heightMap: [] };
      if (imageUrl) {
        imageAnalysis = await analyzeImage(imageUrl, setLoadingProgress);
      }

      setLoadingProgress(60);

      const terrain = generateTerrainFromDetection();
      setTerrainData(terrain);

      if (!canvasRef.current) return;

      // Scene
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0f172a);
      scene.fog = new THREE.Fog(0x0f172a, 15, 60);

      // Camera
      const camera = new THREE.PerspectiveCamera(60, window.innerWidth / (window.innerHeight - 80), 0.1, 1000);
      camera.position.set(8, 6, 8);

      // Renderer
      renderer = new THREE.WebGLRenderer({ canvas: canvasRef.current!, antialias: true });
      renderer.setSize(window.innerWidth, window.innerHeight - 80);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;

      // Lighting
      scene.add(new THREE.AmbientLight(0xffffff, 0.4));
      const sunLight = new THREE.DirectionalLight(0xffffee, 0.8);
      sunLight.position.set(15, 20, 10);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.camera.near = 0.5;
      sunLight.shadow.camera.far = 50;
      sunLight.shadow.camera.left = -20;
      sunLight.shadow.camera.right = 20;
      sunLight.shadow.camera.top = 20;
      sunLight.shadow.camera.bottom = -20;
      scene.add(sunLight);
      const fillLight = new THREE.DirectionalLight(0x88ccff, 0.3);
      fillLight.position.set(-10, 10, -10);
      scene.add(fillLight);

      setLoadingProgress(70);

      // Terrain
      const terrainSize = 30;
      const terrainSegments = 100;
      const groundGeometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainSegments, terrainSegments);
      const positions = groundGeometry.attributes.position;
      const { heightMap } = imageAnalysis;

      for (let i = 0; i < positions.count; i++) {
        const x = positions.getX(i);
        const y = positions.getY(i);
        const normX = (x + terrainSize / 2) / terrainSize;
        const normY = (y + terrainSize / 2) / terrainSize;
        let z = 0;
        if (heightMap.length > 0) {
          const imgX = Math.floor(normX * (heightMap[0].length - 1));
          const imgY = Math.floor(normY * (heightMap.length - 1));
          z = heightMap[imgY]?.[imgX] || 0;
        } else {
          const freq1 = 0.3;
          const freq2 = 0.8;
          const noise1 = Math.sin(x * freq1 + terrain.seed) * Math.cos(y * freq1);
          const noise2 = Math.sin(x * freq2) * Math.cos(y * freq2) * 0.5;
          z = (noise1 + noise2) * terrain.roughness;
        }
        positions.setZ(i, z);
      }
      groundGeometry.computeVertexNormals();

      const ground = new THREE.Mesh(
        groundGeometry,
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 0.9, metalness: 0.1 })
      );
      ground.rotation.x = -Math.PI / 2;
      ground.receiveShadow = true;
      ground.castShadow = true;
      scene.add(ground);

      // Crater
      const craterGeometry = new THREE.CylinderGeometry(terrain.craterRadius, terrain.craterRadius * 0.4, terrain.craterDepth, 32, 8, true);
      const craterPositions = craterGeometry.attributes.position;
      for (let i = 0; i < craterPositions.count; i++) {
        const x = craterPositions.getX(i);
        const z = craterPositions.getZ(i);
        const deformation = Math.random() * 0.2;
        craterPositions.setX(i, x * (1 + deformation));
        craterPositions.setZ(i, z * (1 + deformation));
      }
      craterGeometry.computeVertexNormals();
      const craterColor = severity === 'Critical' ? 0xaa3333 : 0xcc6633;
      const crater = new THREE.Mesh(
        craterGeometry,
        new THREE.MeshStandardMaterial({ color: craterColor, roughness: 0.95, metalness: 0.05, emissive: craterColor, emissiveIntensity: 0.1 })
      );
      crater.position.y = -terrain.craterDepth / 2;
      crater.castShadow = true;
      crater.receiveShadow = true;
      scene.add(crater);

      setLoadingProgress(80);

      // Machinery
      const machineryGroup = new THREE.Group();
      const machineryMat = new THREE.MeshStandardMaterial({ color: 0xffaa00, roughness: 0.7, metalness: 0.6 });
      for (let m = 0; m < terrain.machineryCount; m++) {
        const angle = (Math.PI * 2 * m) / terrain.machineryCount;
        const dist = terrain.craterRadius + 2;
        const base = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.6, 0.9), machineryMat);
        base.position.set(Math.cos(angle) * dist, 0.3, Math.sin(angle) * dist);
        base.castShadow = true;
        const cabin = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.8, 0.7), machineryMat);
        cabin.position.copy(base.position);
        cabin.position.y += 0.7;
        cabin.castShadow = true;
        const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.1, 2, 8), machineryMat);
        arm.position.copy(base.position);
        arm.position.y += 1.2;
        arm.rotation.z = -0.7 + Math.random() * 0.4;
        arm.rotation.y = angle;
        arm.castShadow = true;
        machineryGroup.add(base, cabin, arm);
      }
      scene.add(machineryGroup);

      // Debris
      const rockMaterials = [
        new THREE.MeshStandardMaterial({ color: 0x8b7355, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x6b5d52, roughness: 1 }),
        new THREE.MeshStandardMaterial({ color: 0x5a4a42, roughness: 1 }),
      ];
      for (let i = 0; i < terrain.debrisCount; i++) {
        const size = Math.random() * 0.3 + 0.1;
        const rock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(size, 0),
          rockMaterials[Math.floor(Math.random() * rockMaterials.length)]
        );
        const angle = Math.random() * Math.PI * 2;
        const dist = terrain.craterRadius + Math.random() * 4;
        rock.position.set(Math.cos(angle) * dist, Math.random() * 0.3, Math.sin(angle) * dist);
        rock.rotation.set(Math.random() * Math.PI, Math.random() * Math.PI, Math.random() * Math.PI);
        rock.castShadow = true;
        rock.receiveShadow = true;
        scene.add(rock);
      }

      // Grid
      const gridHelper = new THREE.GridHelper(terrainSize, 30, 0x10b981, 0x1e293b);
      gridHelper.position.y = 0.01;
      scene.add(gridHelper);

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.minDistance = 3;
      controls.maxDistance = 30;
      controls.maxPolarAngle = Math.PI / 2.1;
      controls.target.set(0, 0, 0);

      setLoadingProgress(90);

      // Animation
      const animate = () => {
        animId = requestAnimationFrame(animate);
        controls.update();
        machineryGroup.children.forEach((child, index) => {
          if (index % 3 === 2) {
            (child as THREE.Mesh).rotation.z = -0.7 + Math.sin(Date.now() * 0.0005 + index) * 0.2;
          }
        });
        renderer.render(scene, camera);
      };
      animate();

      setLoadingProgress(100);
      setTimeout(() => setLoading(false), 300);

      const handleResize = () => {
        camera.aspect = window.innerWidth / (window.innerHeight - 80);
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight - 80);
      };
      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
      };
    };

    const cleanup = initializeScene();

    return () => {
      cancelAnimationFrame(animId);
      cleanup.then((fn) => fn?.());
      renderer?.dispose();
    };
  }, [detectionId, lat, lng, area, severity, imageUrl]);

  const handleDownload = () => {
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `mining_3d_model_${detectionId}.png`;
      link.href = canvasRef.current.toDataURL();
      link.click();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b border-border p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">3D Terrain Model</h1>
              <p className="text-sm text-muted-foreground">
                {imageUrl ? 'Image-based' : 'Procedurally generated'} mining site visualization
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="icon" onClick={() => window.location.reload()} title="Reset View">
              <RotateCcw className="w-4 h-4" />
            </Button>
            <Button variant="default" size="icon" onClick={handleDownload} title="Download Screenshot">
              <Download className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative">
        <canvas ref={canvasRef} className="w-full" />

        {/* Loading Overlay */}
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/95">
            <div className="text-center max-w-md px-4">
              <div className="relative w-24 h-24 mx-auto mb-6">
                <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-primary font-bold text-lg">{loadingProgress}%</span>
                </div>
              </div>
              <p className="text-foreground text-xl font-semibold mb-2">Generating 3D Terrain Model</p>
              <p className="text-muted-foreground text-sm mb-4">
                {loadingProgress < 30 && "Analyzing detection data..."}
                {loadingProgress >= 30 && loadingProgress < 60 && imageUrl && "Processing satellite image..."}
                {loadingProgress >= 30 && loadingProgress < 60 && !imageUrl && "Generating terrain..."}
                {loadingProgress >= 60 && loadingProgress < 80 && "Building 3D scene..."}
                {loadingProgress >= 80 && "Finalizing details..."}
              </p>
              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-300"
                  style={{ width: `${loadingProgress}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Info Panel */}
        <div className="absolute top-6 left-6 bg-card/95 backdrop-blur rounded-lg shadow-2xl p-4 border border-border max-w-xs">
          <div className="flex items-start gap-3 mb-3">
            <Info className="w-5 h-5 text-cyan-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="text-sm font-bold text-foreground mb-1">Model Details</h3>
              <p className="text-xs text-muted-foreground">Unique 3D model generated from detection #{detectionId}</p>
            </div>
          </div>

          {terrainData && (
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crater Depth:</span>
                <span className="text-foreground font-semibold">{terrainData.craterDepth.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Crater Radius:</span>
                <span className="text-foreground font-semibold">{terrainData.craterRadius.toFixed(1)}m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Machinery:</span>
                <span className="text-foreground font-semibold">{terrainData.machineryCount} units</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Debris:</span>
                <span className="text-foreground font-semibold">{terrainData.debrisCount} pieces</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Severity:</span>
                <span className={`font-semibold ${severity === 'Critical' ? 'text-red-400' : severity === 'High' ? 'text-orange-400' : 'text-yellow-400'}`}>
                  {severity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Area:</span>
                <span className="text-foreground font-semibold">{parseFloat(area).toFixed(1)} ha</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Coords:</span>
                <span className="text-foreground font-mono text-[10px]">{parseFloat(lat).toFixed(3)}, {parseFloat(lng).toFixed(3)}</span>
              </div>
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-border text-xs text-muted-foreground">
            <p>• Click + drag to rotate</p>
            <p>• Scroll to zoom</p>
            <p>• Right-click to pan</p>
          </div>
        </div>

        {/* Legend */}
        <div className="absolute bottom-6 left-6 bg-card/95 backdrop-blur rounded-lg shadow-2xl p-4 border border-border">
          <h4 className="text-sm font-bold text-foreground mb-3">Legend</h4>
          <div className="space-y-2 text-xs">
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-red-600 rounded shadow" /><span className="text-muted-foreground">Mining Crater</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-yellow-500 rounded shadow" /><span className="text-muted-foreground">Heavy Machinery</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-amber-700 rounded shadow" /><span className="text-muted-foreground">Terrain</span></div>
            <div className="flex items-center gap-2"><div className="w-4 h-4 bg-stone-600 rounded shadow" /><span className="text-muted-foreground">Debris / Rocks</span></div>
          </div>
        </div>
      </div>
    </div>
  );
}
