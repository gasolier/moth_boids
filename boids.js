// helper functions
function get_random_element (arr) {
	return arr[Math.floor(Math.random() * arr.length)];
}

// functions that handle movement
function cohesion (self_boid, distance=150) {
	// move towards the position of surrounding boids that are withing n distance
	let average_position = createVector(0, 0);
	let return_position = createVector(0, 0);
    let added_pos = 0;

	Array.prototype.forEach.call(all_boids, function (boid) {
        if (abs(boid.position.dist(self_boid.position)) < distance) {
		  average_position.add(boid.position);
          added_pos++;
        }
	});

	average_position.div(added_pos);
	
	// set the target position to 1% towards the average
	return_position = p5.Vector.sub(average_position, self_boid.position).div(100);

	return return_position;
}
function separation (self_boid) {
	// avoid obstacles (in this case this means other boids and the lanterns)
	let c = createVector(0, 0);

	Array.prototype.forEach.call(all_boids, function(boid) {
		if (boid != self_boid) {
			// if the positions are lesser than the accepted distance decrease c by the distance
			if (abs(boid.position.dist(self_boid.position)) < 27) {
				c.sub(p5.Vector.sub(boid.position, self_boid.position));
			}
		}
	});

	Array.prototype.forEach.call(all_lanterns, function(lantern) {
		// if the positions are lesser than the accepted distance decrease c by the distance
		if (abs(p5.Vector.add(lantern.position, createVector(31, 40)).dist(self_boid.position)) < 64) {
			c.sub(p5.Vector.sub(p5.Vector.add(lantern.position, createVector(31, 40)), self_boid.position));
		}
	});
	
	return c;
}
function alignment (self_boid, distance=125) {
	// align velocity with other boids that are withing n distance
	let average_velocity = createVector(0, 0);
	let return_velocity = createVector(0, 0);
    let added_vel = 0;
	
	Array.prototype.forEach.call(all_boids, function(boid) {
        if (abs(boid.position.dist(self_boid.position)) < 50) {
		  average_velocity.add(boid.velocity);
          added_vel++;
        }
	});

	average_velocity.div(added_vel);
	
	// set the target velocity 1/8th towards the average
	return_velocity = p5.Vector.sub(average_velocity, self_boid.velocity).div(8);

	return return_velocity;
}
function bound_position (self_boid) {
	// if the boids approach the edges of the screen push them towards their target a little
	let return_vec = createVector(0, 0);
	let target_vec = p5.Vector.sub(self_boid.target.position, self_boid.position);

	if (self_boid.position.x < 10 || self_boid.position.x > 1250) {
		return_vec.x = target_vec.x;
	}

	if (self_boid.position.y < 10 || self_boid.position.y > 630) {
		return_vec.y = target_vec.y;
	}

	return return_vec;
}
function move_towards_goal (self_boid) {
	// move towards your lantern
	let return_vec = createVector(0, 0);

	return_vec = p5.Vector.sub(self_boid.target.position, self_boid.position).div(800);

	return return_vec;
}
function keep_initial_heading (self_boid) {
	// returns the angle we need to rotate by to keep our heading constant
	let return_velocity = createVector(self_boid.velocity.x, self_boid.velocity.y);
    let heading_relative_to_target = p5.Vector.angleBetween(self_boid.velocity, p5.Vector.sub(self_boid.target.position, self_boid.position));
    let required_turn = heading_relative_to_target - self_boid.target_heading;
	return_velocity.rotate(required_turn);
    return return_velocity.div(5);
}

// apply this before adding velocity to position
function limit_vel (self_boid, limit) {
	// stop them going asfastassanic
	if (self_boid.velocity.mag() > limit) {
		self_boid.velocity.div(self_boid.velocity.mag()).mult(limit);
	}
}

// the boid object
function Boid (startx, starty, x_vel, y_vel) {
	this.position = createVector(startx, starty);
	this.velocity = createVector(x_vel, y_vel);
	this.target = get_random_element(all_lanterns);

    // the angle that we will attempt to keep throughout the entire flight
	this.target_heading = random(-HALF_PI, HALF_PI);//p5.Vector.angleBetween(this.velocity, p5.Vector.sub(this.target.position, this.position));
	this.velocity = keep_initial_heading(this);

	this.update_position = function () {
		let v1 = cohesion(this);
		let v2 = separation(this);
		let v3 = alignment(this);
		let v4 = bound_position(this);
		let v5 = keep_initial_heading(this);
		//let v6 = move_towards_goal(this);
		
		this.velocity.add(v1).add(v2).add(v3).add(v4).add(v5);
		limit_vel(this, 10);
		
        this.position.add(this.velocity);

        if (random(100) < 0.001) {
        	console.log("Changed goal");
        	let new_target = get_random_element(all_lanterns);

        	while (new_target == this.target) {
        		new_target = get_random_element(all_lanterns);
        	}

        	this.target_heading = random(-HALF_PI, HALF_PI);
        	this.target = new_target;
        }
	}

	this.draw_self = function () {
		fill(255, 0, 0);
		push();
		translate(this.position.x, this.position.y);
		rotate(this.velocity.heading() + HALF_PI);
		animation(bird_anim, 0, 0, 2, 2);
		pop();
		stroke(255, 0, 0);
		// line(this.position.x, this.position.y, this.target.position.x + 31, this.target.position.y + 40);
	}
}

// the lantern object
function Lantern (x, y) {
	this.position = createVector(x, y);
	let r = random(256);
	let g = random(256);
	let b = random(256);
	this.back_colour = color(r, g, b);
	this.colour_ = color(r, g, b, 96)

	this.draw_self = function () {
		fill(this.colour_);
		noStroke();
		ellipse(this.position.x + 31, this.position.y + 40, 1024, 1024);
		image(lantern_img, this.position.x, this.position.y, 64, 64);
	}
}

function add_lantern () {
	console.log("Adding lantern...");
	let new_lantern = new Lantern(mouseX - 16, mouseY - 16);
	all_lanterns.push(new_lantern);
}

function add_moths (n) {
	for (var i = 0; i < n; i++) {
		let new_boid = new Boid(random(1260), random(640), random(-7,7), random(-7,7));
		all_boids.push(new_boid);
	}
}

function display_panel () {
	let x, y;
	x = mouseX;
	y = mouseY;

    if (display_on == false) {
    	document.getElementById('command-panel').style.setProperty('display', 'block');
    	document.getElementById('command-panel').style.setProperty('transform', 'translate(' + x + 'px, ' + (y + 8) + 'px)');

    	document.getElementById('add-lantern').onclick = function () {
    		add_lantern();
    		document.getElementById('command-panel').style.setProperty('display', 'none');
            display_on = false;
    	}

    	document.getElementById('add-moth-10').onclick = function (ev) {
    		add_moths(10);
    		document.getElementById('command-panel').style.setProperty('display', 'none');
            display_on = false;
    	}

        display_on = true;
    }
    else {
        document.getElementById('command-panel').style.setProperty('display', 'none');
        display_on = false;
    }
}

// load image files
let bird_anim;
let lantern_img;
function preload () {
	bird_anim = loadAnimation("assets/moth1.png", "assets/moth2.png", "assets/moth3.png", "assets/moth4.png", "assets/moth5.png",
							  "assets/moth6.png", "assets/moth7.png", "assets/moth8.png", "assets/moth9.png", "assets/moth10.png",
							  "assets/moth11.png", "assets/moth12.png", "assets/moth1.png");
	bird_anim.frameDelay = 10;
	lantern_img = loadImage("assets/lantern.png");
}

// setup the screen and then start drawing and updating the boids
function setup () {
	let canvas = createCanvas(1260, 640);
	canvas.class('canvas');
	canvas.mouseClicked(display_panel);
	blendMode(ADD);
}

function draw () {
	clear();
	background(0);
	Array.prototype.forEach.call(all_lanterns, function(lantern) {
		lantern.draw_self();
	});
	Array.prototype.forEach.call(all_boids, function(boid) {
		boid.update_position();
	});
	Array.prototype.forEach.call(all_boids, function(boid) {
		boid.draw_self();
	});
}

// global variables that store important info
let all_boids = new Array();
let all_lanterns = new Array();
let display_on = false;