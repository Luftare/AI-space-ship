function createImage(src) {
  const image = new Image();
  image.src = src;
  return image;
}

function getFreefallTouchDownVelocity() {
  return GRAVITY * ((2 * START_HEIGHT / GRAVITY) ** 0.5);
}

function addEventListeners() {
  document.getElementById("render").addEventListener("change", (e) => {
    shouldRender = e.target.checked;
  });
}

function getNewGeneration() {
  const elite = getElite();
  const eliteCount = INCLUDE_RANDOM_NETWORKS ? POPULATION_SIZE / 2 : POPULATION_SIZE;
  const randomCount = POPULATION_SIZE - eliteCount;
  return [
    ...[...Array(eliteCount)].map((_, index) => elite[index % elite.length].clone().mutate(index)),
    ...getRandomGeneration(randomCount)
  ];
}

function landingVelocityToCost(velocity) {
  return Math.pow(velocity, 4);
}

function consumedFuelToCost(fuel) {
  return ROCKET_FUEL_COST * fuel;
}

function getElite() {
  return rockets.map(rocket => {
    rocket.fitness += -landingVelocityToCost(rocket.maxLandingVelocity) - consumedFuelToCost(rocket.allRoundsConsumedFuel);
    return rocket;
  }).sort((a, b) => b.fitness - a.fitness).slice(0, ELITE_COUNT);
}

function handleAllRocketsLanded() {
  round++;
  if(round <= ROUNDS_PER_GENERATION) {
    rockets = rockets.map(rocket => {
      rocket.landed = false;
      rocket.allRoundsConsumedFuel += ROCKET_FUEL - rocket.fuel;
      rocket.fuel = ROCKET_FUEL;
      rocket.crashed = false;
      rocket.maxLandingVelocity = Math.max(rocket.landingVelocity, rocket.maxLandingVelocity);
      rocket.minLandingVelocity = Math.min(rocket.landingVelocity, rocket.minLandingVelocity);
      return rocket;
    });
  } else {
    pushNewEntryToLog();
    updateGraph();
    round = 0;
    rockets = getNewGeneration();
  }

  const roundMultiplier = round / ROUNDS_PER_GENERATION;
  const rocketStartHeight = -(START_HEIGHT + roundMultiplier * HEIGHT_VARIABLE_PART + Math.random() * START_HEIGHT_VARIANCE);
  rockets.forEach(rocket => rocket.y = rocketStartHeight);
}

function pushNewEntryToLog() {
  const elite = getElite();
  const bestRocket = elite[0];

  const allRoundsFuelReserve = ROUNDS_PER_GENERATION * ROCKET_FUEL;
  log.push({
    maxLandingVelocity: Math.abs(bestRocket.maxLandingVelocity),
    minLandingVelocity: Math.abs(bestRocket.minLandingVelocity),
    fuelConsumption: 100 * bestRocket.allRoundsConsumedFuel / allRoundsFuelReserve,
    totalCost: -bestRocket.fitness
  });
}

function updateGraph() {
  const x = log.map((_, index) => index + 1);

  Plotly.newPlot(
    graphs.velocity,
    [{
      x,
      y: log.map(data => data.maxLandingVelocity),
      name: 'max',
      line: { color: 'red' }
    },{
      x,
      y: log.map(data => data.minLandingVelocity),
      name: 'min',
      line: { color: 'green' }
    },{
      x,
      y: log.map(() => ROCKET_CRASH_MIN_VELOCITY),
      name: 'crash',
      line: { color: 'black' }
    }],
    {title: 'Landing velocity'},
    {displayModeBar: false}
  );

  Plotly.newPlot(
    graphs.fuel,
    [{
      x,
      y: log.map(data => data.fuelConsumption)
    }],
    {title: 'Fuel consumed (%)'},
    {displayModeBar: false}
  );

  Plotly.newPlot(
    graphs.totalCost,
    [{
      x,
      y: log.map(data => data.totalCost)
    }],
    {title: 'Total cost'},
    {displayModeBar: false}
  );
}

function boot() {
  updateGraph();
  addEventListeners();
  rockets = getRandomGeneration(POPULATION_SIZE);
  loop();
}

function getRandomGeneration(count) {
  return [...Array(count)].map(() => new Rocket());
}

function loop() {
  canvas.width = canvas.scrollWidth;
  canvas.height = canvas.scrollHeight;
  rockets.forEach((rocket, index) => {
    rocket.update();

    if(shouldRender) {
      const relativeIndex = index / rockets.length;
      rocket.draw(relativeIndex);
    }
  });
  const allRocketsLanded = rockets.every(rocket => rocket.landed);
  if(allRocketsLanded) {
    handleAllRocketsLanded();
  }
  if(shouldRender) {
    requestAnimationFrame(loop);
  } else {
    const useTimeout = Date.now() % 13 === 0;
    if(useTimeout) {
      setTimeout(loop, 0);
    } else {
      loop();
    }
  }
}

window.onload = boot;