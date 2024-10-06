import React, { useEffect, useState } from "react";
import axios from "axios";
import * as THREE from 'three';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import './App.css'; // Assuming you create an App.css file for styling

function App() {
  const [neos, setNeos] = useState([]);
  const [selectedObject, setSelectedObject] = useState(null);
  const [timeScale, setTimeScale] = useState(1);
  const [showCard, setShowCard] = useState(false); // State to manage card visibility
  const [activeTab, setActiveTab] = useState('item1'); // State to manage active tab

  useEffect(() => {
    const fetchData = async () => {
      const response = await axios.get(
        "https://api.nasa.gov/neo/rest/v1/feed?start_date=2024-10-01&end_date=2024-10-05&api_key=DEMO_KEY"
      );
      const neosData = response.data.near_earth_objects;
      const flattenedNeos = Object.values(neosData).flat();
      setNeos(flattenedNeos);
    };

    fetchData();
  }, []);

  useEffect(() => {
    // Initialize Three.js elements
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 5, 30);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 10;
    controls.maxDistance = 200;

    const sunLight = new THREE.PointLight(0xffffff, 5, 100);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const textureLoader = new THREE.TextureLoader();
    const sunTexture = textureLoader.load('/textures/8k_sun.jpg');

    const sunGeometry = new THREE.SphereGeometry(1.5, 32, 32);
    const sunMaterial = new THREE.MeshStandardMaterial({ map: sunTexture });
    const sun = new THREE.Mesh(sunGeometry, sunMaterial);
    scene.add(sun);

    const createPlanet = (size, texturePath, distanceFromSun, speed, tilt, name, description, additionalInfo) => {
      const geometry = new THREE.SphereGeometry(size, 32, 32);
      const texture = textureLoader.load(texturePath);
      const material = new THREE.MeshStandardMaterial({ map: texture });
      const planet = new THREE.Mesh(geometry, material);
      planet.userData = { distanceFromSun, speed, angle: 0, tilt, rotating: true, name, description, ...additionalInfo };
      scene.add(planet);

      const pathGeometry = new THREE.RingGeometry(distanceFromSun - 0.01, distanceFromSun + 0.01, 100);
      const pathMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide });
      const path = new THREE.Mesh(pathGeometry, pathMaterial);
      path.rotation.x = Math.PI / 2;
      scene.add(path);

      return planet;
    };

    const planets = {
      mercury: createPlanet(0.3, "/textures/8k_mercury.jpg", 2, 0.02, 0.03, "Mercury", "The smallest planet in our solar system and closest to the Sun.", { diameter: 4879, orbitalPeriod: 88, moons: 0 }),
      venus: createPlanet(0.4, "/textures/8k_venus_surface.jpg", 3, 0.015, 177.4, "Venus", "The second planet from the Sun and Earth's closest planetary neighbor.", { diameter: 12104, orbitalPeriod: 225, moons: 0 }),
      earth: createPlanet(0.5, "/textures/8k_earth_daymap.jpg", 5, 0.01, 23.5, "Earth", "The only planet known to support life.", { diameter: 12742, orbitalPeriod: 365, moons: 1 }),
      mars: createPlanet(0.4, "/textures/8k_mars.jpg", 7, 0.008, 25.19, "Mars", "The Red Planet, known for its dusty, dry landscape.", { diameter: 6779, orbitalPeriod: 687, moons: 2 }),
      jupiter: createPlanet(1, "/textures/8k_jupiter.jpg", 12, 0.005, 3.13, "Jupiter", "The largest planet in our solar system.", { diameter: 139820, orbitalPeriod: 4333, moons: 79 }),
      saturn: createPlanet(0.9, "/textures/8k_saturn.jpg", 15, 0.004, 26.73, "Saturn", "The planet known for its stunning ring system.", { diameter: 116460, orbitalPeriod: 10759, moons: 82 }),
      uranus: createPlanet(0.6, "/textures/2k_uranus.jpg", 18, 0.003, 97.77, "Uranus", "An ice giant with a unique sideways rotation.", { diameter: 50724, orbitalPeriod: 30687, moons: 27 }),
      neptune: createPlanet(0.6, "/textures/2k_neptune.jpg", 21, 0.002, 28.32, "Neptune", "The farthest planet from the Sun in our solar system.", { diameter: 49244, orbitalPeriod: 60190, moons: 14 }),
    };



    const asteroidBelt = [];
    const asteroidTexture = textureLoader.load("/textures/3215-v1.jpg");

    for (let i = 0; i < 50; i++) {
      const asteroidSize = Math.random() * 0.05 + 0.05;
      const asteroidGeometry = new THREE.SphereGeometry(asteroidSize, 16, 16);
      const asteroidMaterial = new THREE.MeshStandardMaterial({ map: asteroidTexture });
      const asteroid = new THREE.Mesh(asteroidGeometry, asteroidMaterial);

      const distanceFromSun = THREE.MathUtils.randFloat(7.5, 12);
      const angle = Math.random() * Math.PI * 2;
      asteroid.position.set(Math.cos(angle) * distanceFromSun, 0, Math.sin(angle) * distanceFromSun);
      asteroid.userData = { angle, speed: Math.random() * 0.001 + 0.0005 }; // Assign a random speed
      scene.add(asteroid);
      asteroidBelt.push(asteroid);

      // Create an orbit ring for the asteroid with a random tilt
      const orbitGeometry = new THREE.RingGeometry(distanceFromSun - 0.01, distanceFromSun + 0.01, 100);
      const orbitMaterial = new THREE.MeshBasicMaterial({ color: 0x888888, side: THREE.DoubleSide });
      const orbit = new THREE.Mesh(orbitGeometry, orbitMaterial);
      orbit.rotation.x = Math.PI / 2; // Rotate the orbit to lie in the x-z plane
      orbit.rotation.y = Math.random() * Math.PI * 2; // Random tilt
      orbit.rotation.z = Math.random() * Math.PI * 2; // Random tilt
      scene.add(orbit);
    }

    const neosObjects = [
      {
        name: "Ryugu",
        distanceFromSun: 10,
        discovery: "Discovered in 1999 by LINEAR",
        classification: "NEO",
      },
      {
        name: "Itokawa",
        distanceFromSun: 15,
        discovery: "Discovered in 2005 by Hayabusa",
        classification: "PHO",
      },
      {
        name: "Donald Johanson",
        distanceFromSun: 20,
        discovery: "Discovered in 1992.",
        classification: "NEO",
      },
      {
        name: "Dinkinesh",
        distanceFromSun: 25,
        discovery: "Discovered in 2008.",
        classification: "NEO",
      },
      {
        name: "Apophis",
        distanceFromSun: 30,
        discovery: "Discovered in 2004. Notable for its potential impact risk.",
        classification: "PHO",
      },
      {
        name: "Bennu",
        distanceFromSun: 35,
        discovery: "Discovered in 1999. Studied by NASA's OSIRIS-REx mission.",
        classification: "PHO",
      }
    ];

    const neoTextures = {
      ryugu: "/textures/3215-v3.jpg",
      itokawa: "/textures/3215-v4.jpg",
    };

    const neoMeshes = [];
    neosObjects.forEach((neo) => {
      const neoSize = 0.2;
      const neoGeometry = new THREE.SphereGeometry(neoSize, 16, 16);
      const texturePath = neoTextures[neo.name.toLowerCase()];
      const neoTexture = textureLoader.load(texturePath);
      const neoMaterial = new THREE.MeshStandardMaterial({
        color: neo.classification === "NEO" ? 0x00ff00 : 0xff0000
      });
      const neoMesh = new THREE.Mesh(neoGeometry, neoMaterial);

      neoMesh.userData = { ...neo, angle: 0 };
      scene.add(neoMesh);
      neoMeshes.push(neoMesh);
    });

    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const handleObjectClick = (event) => {
      mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects([...Object.values(planets), ...neoMeshes]);
      if (intersects.length > 0) {
        const selectedObject = intersects[0].object;
        const { name, description, discovery, classification, distanceFromSun, diameter, orbitalPeriod, moons } = selectedObject.userData;
        const { x, y, z } = selectedObject.position;
        setSelectedObject({
          name,
          description: description || discovery,
          classification: classification || null,
          distanceFromSun,
          diameter,
          orbitalPeriod,
          moons,
          coordinates: { x, y, z }
        });

        camera.position.set(x, y + 3, z + 10);
        controls.target.set(x, y, z);
        controls.update();
      }
    };

    window.addEventListener("click", handleObjectClick);

    const onWindowResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };

    window.addEventListener("resize", onWindowResize);

    const animate = () => {
      requestAnimationFrame(animate);

      Object.values(planets).forEach((planet) => {
        planet.userData.angle += planet.userData.speed * timeScale;
        planet.position.x = Math.cos(planet.userData.angle) * planet.userData.distanceFromSun;
        planet.position.z = Math.sin(planet.userData.angle) * planet.userData.distanceFromSun;

        if (planet.userData.rotating) {
          planet.rotation.y += 0.01;
        }
      });

      neoMeshes.forEach((neo) => {
        neo.userData.angle += 0.01 * timeScale;
        neo.position.x = Math.cos(neo.userData.angle) * neo.userData.distanceFromSun;
        neo.position.z = Math.sin(neo.userData.angle) * neo.userData.distanceFromSun;
      });

      asteroidBelt.forEach((asteroid) => {
        asteroid.userData.angle += asteroid.userData.speed * timeScale;
        asteroid.position.x = Math.cos(asteroid.userData.angle) * asteroid.position.length();
        asteroid.position.z = Math.sin(asteroid.userData.angle) * asteroid.position.length();
      });

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.removeEventListener("resize", onWindowResize);
      window.removeEventListener("click", handleObjectClick);
      document.body.removeChild(renderer.domElement);
    };
  }, [neos, timeScale]);

  const increaseSpeed = () => setTimeScale(timeScale + 0.5);
  const decreaseSpeed = () => setTimeScale(Math.max(0.1, timeScale - 0.5));

  const renderContent = () => {
    switch (activeTab) {
      case 'item1':
        return <p>Asteroids and comets are remnants left over from the early formation of our solar system 4.6 billion years ago. Asteroids are mostly rocky bodies that formed closer to the Sun than
        Jupiter, while comets formed farther from the Sun and contain substantial amounts of frozen ices. The vast majority of these small bodies are asteroids, and most of them reside withir
        the main belt, between the orbits of Mars and Jupiter.
        
        The current number of known asteroids in the entire solar system is:
        1,362,002</p>;
      case 'item2':
        return <p>Some asteroids will inevitably approach Earth, and
        these are tracked by NASA. The Center for Near-
        Earth Object Studies (CNEOS) computes the orbits
        of asteroids and comets and their odds of impacting
        Earth. The orbits of all asteroids seen here are
        publicly available from NASA's Solar System
        Dynamics (SSD) group.</p>;
      case 'item3':
        return <p>NEOs are small Solar System bodies that orbit the sun and come within 1.3 times the distance between the Earth and the sun.
          NEOs are formed when nearby planets' gravitational pull nudges asteroids and comets into orbits that bring them close to Earth.
        </p>;
      default:
        return null;
    }
  };

  return (
    <>
      {selectedObject && (
        <div className="info-panel">
          <h2>{selectedObject.name}</h2>
          <p>{selectedObject.description}</p>
          {selectedObject.classification && (
            <p><strong>Classification:</strong> {selectedObject.classification}</p>
          )}
          {selectedObject.distanceFromSun && (
            <p><strong>Distance from Sun:</strong> {selectedObject.distanceFromSun} AU</p>
          )}
          {selectedObject.diameter && (
            <p><strong>Diameter:</strong> {selectedObject.diameter} km</p>
          )}
          {selectedObject.orbitalPeriod && (
            <p><strong>Orbital Period:</strong> {selectedObject.orbitalPeriod} days</p>
          )}
          {selectedObject.moons !== undefined && (
            <p><strong>Number of Moons:</strong> {selectedObject.moons}</p>
          )}
          {selectedObject.coordinates && (
            <p><strong>Coordinates:</strong> x: {selectedObject.coordinates.x.toFixed(2)}, y: {selectedObject.coordinates.y.toFixed(2)}, z: {selectedObject.coordinates.z.toFixed(2)}</p>
          )}
          <button onClick={() => setSelectedObject(null)}>Close</button>
        </div>
      )}
      <div className="controls">
        <button onClick={increaseSpeed}>Speed Up</button>
        <button onClick={decreaseSpeed}>Slow Down</button>
      </div>
      <button className="top-right-button" onClick={() => setShowCard(!showCard)}>Show Info</button>
      {showCard && (
        <div className="transparent-card">
          <div className="tab-buttons">
            <button onClick={() => setActiveTab('item1')}>Asteroids</button>
            <button onClick={() => setActiveTab('item2')}>PHOs</button>
            <button onClick={() => setActiveTab('item3')}>NEOs</button>
          </div>
          <div className="tab-content">
            {renderContent()}
          </div>
          <button onClick={() => setShowCard(false)}>Close</button>
        </div>
      )}
    </>
  );
}

export default App;