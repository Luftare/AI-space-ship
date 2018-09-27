class Rocket {
  constructor(
    network = new Architect.Perceptron(...ROCKET_NETWORK_LAYERS),
    isHuman = false
  ) {
    this.fitness = 0;
    this.isHuman = isHuman;
    this.network = network;
    this.fuel = ROCKET_FUEL;
    this.allRoundsConsumedFuel = 0;
    this.power = ROCKET_POWER;
    this.x = 0.5;
    this.y = -START_HEIGHT;
    this.vY = 0;
    this.width = 40;
    this.height = 50;
    this.landed = false;
    this.landingVelocity = null;
    this.maxLandingVelocity = -Infinity;
    this.minLandingVelocity = Infinity;
    this.thrustActive = false;
  }

  handleUserInput() {
    const arrowUpPressed = keysDown.ArrowUp;
    if(arrowUpPressed) {
      this.applyThrust();
    }
  }

  update() {
    this.thrustActive = false;
    if(!this.landed) {
      if(this.isHuman) {
        this.handleUserInput();
      } else {
        this.applyNetworkInput();
      }
      this.applyForces();
      this.handleTouchdown();
    }
  }

  clone() {
    const network = this.network.toJSON();
		return new Rocket(Network.fromJSON(network));
  }

	mutate(amount) {
    const input = [Math.random(), Math.random(), Math.random()];
		const output = [Math.random()];
		for (let i = 0; i < amount; i++) {
			this.network.activate(input);
			this.network.propagate(ROCKET_LEARNING_RATE, output);
		}
		return this;
	}

  applyNetworkInput() {
    const input = this.getNormalizedInput();
    const output = this.network.activate(input);
    if(output[0] > 0.5) {
      this.applyThrust();
    }
  }

  getNormalizedInput() {
    const freefallVelocity = getFreefallTouchDownVelocity();
    return [
      this.y / START_HEIGHT,
      -this.vY / freefallVelocity,
      this.fuel / ROCKET_FUEL
    ];
  }

  applyThrust() {
    if(this.fuel > 0) {
      this.thrustActive = true;
      this.fuel--;
      this.vY -= ROCKET_POWER;
    }
  }

  handleTouchdown() {
    if(this.y >= 0) {
      this.crashed = this.landingVelocity > ROCKET_CRASH_MIN_VELOCITY;
      this.landed = true;
      this.landingVelocity = this.vY;
      this.vY = 0;
      this.y = 0;
    }
  }

  applyForces() {
    this.vY += GRAVITY;
    this.y += this.vY;
  }

  draw(relativeX) {
    const image = images[this.crashed ? 'rocketCrash' : 'rocket'];
    const canvasHeight = canvas.scrollHeight;
    const { width, height } = image;
    const y = canvasHeight + this.y - height;
    const x = canvas.scrollWidth * relativeX - width / 4;
    ctx.drawImage(image, x, y, width, height);

    if(this.thrustActive) this.drawAfterBurner(relativeX, image);
  }

  drawAfterBurner(relativeX, bodyImage) {
    const canvasHeight = canvas.scrollHeight;
    const { width, height } = images.fire;
    const y = canvasHeight + this.y;
    const x = canvas.scrollWidth * relativeX - width / 2 + bodyImage.width / 4;
    ctx.drawImage(images.fire, x, y, width, height);
  }
}