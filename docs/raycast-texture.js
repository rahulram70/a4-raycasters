const raycast_textures = ( sketch ) => {

  const TILE_SIZE = 24;
  const MAP_NUM_ROWS = 11;
  const MAP_NUM_COLS = 15;

  const WINDOW_WIDTH = MAP_NUM_COLS * TILE_SIZE;
  const WINDOW_HEIGHT = MAP_NUM_ROWS * TILE_SIZE;
  const RAYWIDTH = Math.ceil((WINDOW_HEIGHT / WINDOW_WIDTH) * (WINDOW_WIDTH / 300));
  const TEX_WIDTH = 64;
  const TEX_HEIGHT = 64;
  console.log("raywidth: " + RAYWIDTH);


  console.log(WINDOW_WIDTH);
  console.log(WINDOW_HEIGHT);

  var FOV = 60 * (Math.PI / 180);

  const NUM_RAYS = Math.floor(WINDOW_WIDTH/4);

  var mouse;

  class Map {
    constructor() {
      this.grid = [
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1],
        [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 1, 1, 1, 1, 1, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
        [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1]
      ];
    }

    // a very userful function for checking if there is a wall at a point
    hasWallAt(x, y) {
      return this.grid[Math.floor(y / TILE_SIZE)][Math.floor(x / TILE_SIZE)];
    }

    render() {
      for (var i = 0; i < MAP_NUM_ROWS; i++) {
        for (var j = 0; j < MAP_NUM_COLS; j++) {
          let tileX = j * TILE_SIZE;
          let tileY = i * TILE_SIZE;
          let tileColor = this.grid[i][j] == 1 ? "#222" : "#fff";
          sketch.fill(tileColor);
          sketch.stroke("#222");
          sketch.rect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        }
      }
    }
  }

  class Player {
    constructor() {
      this.x = WINDOW_WIDTH / 2;
      this.y = WINDOW_HEIGHT / 2;
      this.radius = 3;
      this.turnDirection = 0;
      this.walkDirection = 0;
      this.rotationAngle = Math.PI / 2;
      this.moveSpeed = 2.5;
      this.rotationSpeed = 2 * (Math.PI / 180);
    }

    update() {
      this.rotationAngle += this.turnDirection * this.rotationSpeed;

      //if (!grid.hasWallAt(this.x, this.y)) {
        // only do that if the player is not colliding
        let moveStep = this.walkDirection * this.moveSpeed;
        this.x += Math.cos(this.rotationAngle) * moveStep;
        this.y += Math.sin(this.rotationAngle) * moveStep;
      //}

      // reseting angle
      if (this.rotationAngle < 0)
        this.rotationAngle += 2 * Math.PI;
      if (this.rotationAngle > 2 * Math.PI)
        this.rotationAngle -= 2 * Math.PI;

    }


    render() {
      sketch.noStroke();
      sketch.fill("red");
      sketch.circle(this.x, this.y, this.radius);
      sketch.stroke("red");

      // a line for showing the direction of the player
      /*sketch.line(
        this.x,
        this.y,
        this.x + Math.cos(this.rotationAngle) * 30,
        this.y + Math.sin(this.rotationAngle) * 30
      );*/
    }
  }

  class RayLine {
    constructor(rayAngle) {
      this.rayAngle = normalizeAngle(rayAngle); // the angle will be normalized
      this.wallHitX = 0;
      this.wallHitY = 0;
      this.distance = 0;
      this.side = 0;

      this.color = 255;

      // booleans to check if the player is looking at the directions
      this.isRayFacingDown = this.rayAngle > 0 && this.rayAngle < Math.PI; // the y is inverted, so the up is down wow
      this.isRayFacingUp = !this.isRayFacingDown;
      this.isRayFacingRight = this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI;
      this.isRayFacingLeft = !this.isRayFacingRight;
    }

    cast(columnId) {
      var xintersect, yintersect; // variables for storing the first intersection (that one that has the player position)
      var xstep, ystep;           // variables for storing the xstep and the ystep after finding the xintersect and yintersect

      ////////////////////////////////////////////////
      // HORIZONTAL INTERSECTION CHECKING
      ///////////////////////////////////////////////
      var foundHorizontalWall = false; // we have to check if we found a wall (horizontal)
      var horizontalWallHitX = 0;      // var to store the X position of the wall in horizontal which was hit
      var horizontalWallHitY = 0;      // var to store the Y position of the wall in horizontal which was hit

      yintersect = Math.floor(player.y / TILE_SIZE) * TILE_SIZE; // the position of the first intersection

      // TODO: explain the math behind this shit
      if (this.rayAngle > 0 && this.rayAngle < Math.PI) // looking down
        yintersect += TILE_SIZE;

      xintersect = player.x + (yintersect - player.y) / Math.tan(this.rayAngle); // the x position of the first intersection

      ystep = TILE_SIZE; // the y step for the horizontal checking will be the same as the tile size (only if the player is looking down)
      if (!(this.rayAngle > 0 && this.rayAngle < Math.PI)) // looking up
        ystep *= -1;

      xstep = ystep/Math.tan(this.rayAngle); // TODO: explain the math behind this thing

      // the next intersection starts at the first intersection (with the player)
      var nextHorizontalX = xintersect;
      var nextHorizontalY = yintersect;

      // TODO: explain the math behind this
      if (!(this.rayAngle > 0 && this.rayAngle < Math.PI)) // looking up (see that is the same as the above)
        nextHorizontalY -= 0.01;


      // checking the horizontal lines //

      // while the it is inside the window
      while (nextHorizontalX <= WINDOW_WIDTH && nextHorizontalX >= 0 && nextHorizontalY <= WINDOW_HEIGHT && nextHorizontalY >= 0) {
        // if there is a wall at the position found in nextHorizontalX and Y
        if (grid.hasWallAt(nextHorizontalX, nextHorizontalY)) {
          foundHorizontalWall = true;
          // we need to store the position of the wall found
          horizontalWallHitX = nextHorizontalX;
          horizontalWallHitY = nextHorizontalY;
          break;
        } else {
          // if we didn't found a wall, we need to keep checking
          nextHorizontalX += xstep;
          nextHorizontalY += ystep;
        }
      }

      /////////////////////////////////////
      // VERTICAL INTERSECTION CHECKING
      ////////////////////////////////////
      var foundVerticalWall = false;
      var verticalWallHitX = 0;
      var verticalWallHitY = 0;

      xintersect = Math.floor(player.x / TILE_SIZE) * TILE_SIZE;
      if (this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI) // facing right
        xintersect += TILE_SIZE;

      yintersect = player.y + (xintersect - player.x) * Math.tan(this.rayAngle); // TODO: see why is player.x + ...

      xstep = TILE_SIZE;

      if (!(this.rayAngle < 0.5 * Math.PI || this.rayAngle > 1.5 * Math.PI)) // facing left
        xstep *= -1;

      ystep = xstep * Math.tan(this.rayAngle);

      var nextVerticalX = xintersect;
      var nextVerticalY = yintersect;


      if (this.isRayFacingLeft)
        nextVerticalX -= 0.01;



      while (nextVerticalX >= 0 && nextVerticalX <= WINDOW_WIDTH && nextVerticalY >= 0 && nextVerticalY <= WINDOW_HEIGHT) {

        if (grid.hasWallAt(nextVerticalX, nextVerticalY)) {
          foundVerticalWall = true;
          verticalWallHitX = nextVerticalX;
          verticalWallHitY = nextVerticalY;

          break;
        } else {
          nextVerticalX += xstep;
          nextVerticalY += ystep;
        }
      }


      /////////////////////////////////////////////////////////////////////////
      // Distance calculation
      /////////////////////////////////////////////////////////////////////////
      // we need to compare the horizontal distance with the vertical distance.
      // then check which one is the nearest to the player
      /////////////////////////////////////////////////////////////////////////
      var horizontalDistance;
      var verticalDistance;

      if (foundHorizontalWall) {
        horizontalDistance = distanceBetween(player.x, player.y, horizontalWallHitX, horizontalWallHitY);
      } else {
        horizontalDistance = Number.MAX_VALUE;
      }
      if (foundVerticalWall) {
        verticalDistance = distanceBetween(player.x, player.y, verticalWallHitX, verticalWallHitY);
      } else {
        verticalDistance = Number.MAX_VALUE;
      }

      this.wallHitX = (horizontalDistance < verticalDistance) ? horizontalWallHitX : verticalWallHitX;
      this.wallHitY = (horizontalDistance < verticalDistance) ? horizontalWallHitY : verticalWallHitY;

      this.distance = (horizontalDistance < verticalDistance) ? horizontalDistance : verticalDistance;
      this.distance *= Math.cos(player.rotationAngle - this.rayAngle);

      if (verticalDistance < horizontalDistance) {
        this.color = 160;
        this.side = 0;
        
      }
      if (horizontalDistance < verticalDistance) {
        this.color = 255;
        this.side = 1;
      }



    }

    render() {
      sketch.stroke("red");
      sketch.line(
        player.x,
        player.y,
        this.wallHitX,
        this.wallHitY
      );
    }
  }

  var grid = new Map();
  var player = new Player();
  var rays = [];

  sketch.keyPressed = () => {
    if (sketch.keyCode == sketch.UP_ARROW) {
      player.walkDirection = 0.5
    } else if (sketch.keyCode == sketch.DOWN_ARROW) {
      player.walkDirection = -0.5;
    } else if (sketch.keyCode == sketch.RIGHT_ARROW) {
      player.turnDirection = 0.5;
    } else if (sketch.keyCode == sketch.LEFT_ARROW) {
      player.turnDirection = -0.5;
    }
  }

  sketch.keyReleased = () => {
    if (sketch.keyCode == sketch.UP_ARROW) {
      player.walkDirection = 0;
    } else if (sketch.keyCode == sketch.DOWN_ARROW) {
      player.walkDirection = 0;
    } else if (sketch.keyCode == sketch.RIGHT_ARROW) {
      player.turnDirection = 0;
    } else if (sketch.keyCode == sketch.LEFT_ARROW) {
      player.turnDirection = 0;
    }
  }

  function normalizeAngle(angle) {
      angle = angle % (2 * Math.PI);
      if (angle < 0) {
          angle = (2 * Math.PI) + angle;
      }
      return angle;
  }

  function distanceBetween(x1, y1, x2, y2) {
    // TODO: TROCAR ISSO AQUI PELO O QUE TA NO PAPEL PRA VER NO QUE DÁ
    return Math.sqrt((x2 - x1)*(x2 - x1) + (y2 - y1)*(y2 - y1));
  }

  function castAllRays(sliderRays) {
      var columnId = 0;

      // start first ray subtracting half of the FOV

      rays = [];

      // loop all columns casting the rays
      for (var i = 0; i < sliderRays; i++) {
          var rayAngle = (player.rotationAngle - FOV/2.0) + (i/NUM_RAYS) * FOV; // TODO: REVIEW AND TRY TO EXPLAIN THIS LINE OF CODE
          var rayLine = new RayLine(rayAngle);
          rayLine.cast();
          rays.push(rayLine);

          // rayAngle += FOV / NUM_RAYS;

          columnId++; //useless
      }
  }

  function setFOV(angle) {
    FOV = angle * (Math.PI/180);
  }

  let tex;
  let buffer = [];
  let texture = [];
  let d = sketch.pixelDensity();
  sketch.preload = () => {
    tex = sketch.loadImage("https://raw.githubusercontent.com/daviskauffmann/raycaster/master/assets/images/eagle.png");
  }
  //let slider2;
  sketch.setup = () => {
    var myCanvas = sketch.createCanvas(WINDOW_WIDTH*2, WINDOW_HEIGHT);
    //slider2 = sketch.createSlider(1, NUM_RAYS, NUM_RAYS);
    //slider2.parent("#slider2");
    myCanvas.parent("gameWindow")
    //bg = sketch.loadImage('https://raw.githubusercontent.com/daviskauffmann/raycaster/master/assets/images/eagle.png');
    sketch.mouse = sketch.mouseX;
    // load texture array
    for (var i = 0; i < WINDOW_HEIGHT; i++) {
      buffer[i] = [];
      for(var j = 0; j < WINDOW_WIDTH; j++) {
        buffer[i][j] = 0;
      }
    }

    for (var i = 0; i < TEX_WIDTH*TEX_HEIGHT; i++) {
      texture[i] = 0;
    }

    for (var x = 0; x < TEX_WIDTH; x++) {
      for (var y = 0; y < TEX_HEIGHT; y++) {
        if (x % 16 == 0 || y % 16 == 0) {
          texture[TEX_WIDTH * y + x] = 0;
        } else {
          texture[TEX_WIDTH * y + x] = 65536 * 192;
        }
        
      }
    }
    console.log("buff len: " + buffer.length);
    //sketch.loadPixels();
    

  }

  function update() {
    player.update();

  }




  sketch.draw = () => {
    //clear();
    update();
    //sketch.image(tex,WINDOW_WIDTH,0, sketch.width, sketch.height);
    //sketch.loadPixels();
    grid.render();
    castAllRays(NUM_RAYS);

    for (rayLine of rays) {
      rayLine.render();
    }
    player.render();

    //console.log("num rays: " + NUM_RAYS);
    /*for (var x = WINDOW_WIDTH; x < 2*WINDOW_WIDTH; x++) {
      for (var y = 0; y < WINDOW_HEIGHT; y++) {
        //pixelColor.setRed(red);
        //pixelColor.setGreen(green);
        //pixelColor.setBlue(blue);
        let colorVal = sketch.color(0);
        sketch.set(x, y, colorVal);
      }
    }*/
    for (var i = 0; i < NUM_RAYS; i++) {
      var lineHeight = 32*(WINDOW_HEIGHT) / rays[i].distance;

      var drawStart = Math.floor(-lineHeight / 2) + Math.floor((WINDOW_HEIGHT) / 2);
      if (drawStart < 0)
        drawStart = 0;
      var drawEnd   = Math.floor(lineHeight / 2) + Math.floor(WINDOW_HEIGHT / 2);
      if (drawEnd >= WINDOW_HEIGHT)
        drawEnd = WINDOW_HEIGHT - 1;



      // where 3d stuff is being rendered
      sketch.noStroke();
      sketch.stroke(rays[i].color);
      sketch.strokeWeight(4);
      sketch.fill(255, 0, 0);
      let sampleX = Math.abs(rays[i].wallHitX - Math.floor(rays[i].wallHitX));
      if (sampleX < 0.001 || sampleX > 0.999) {
        sampleX = Math.abs(rays[i].wallHitY - Math.floor(rays[i].wallHitY));
      }

      //sketch.imageMode(sketch.CENTER);
      //sketch.image(tex, (i+0.5) * RAYWIDTH + WINDOW_WIDTH, drawStart+133, RAYWIDTH, WINDOW_HEIGHT, i,
      //sketch.int(sampleX * tex.width), 0, 1, tex.height);
      //sketch.image(tex, 0, 0, 1, WINDOW_HEIGHT);
      //sketch.pixelDensity(1);
      //sketch.loadPixels();
      //sketch.updatePixels();
      //sketch.image(tex, i + WINDOW_WIDTH, (drawStart-TILE_SIZE), RAYWIDTH, drawStart-drawEnd, i,
      //sketch.int(sampleX * tex.width), 0, 1, tex.height);
      
      // i*4 + WINDOW_WIDTH
      //console.log("player x: " + player.x / TILE_SIZE + " player y: " + player.y / TILE_SIZE + "player dist: " + rays[i].distance / TILE_SIZE
      //+ " player angle: " + player.rotationAngle);
      var wallX;
      var rayDirX = Math.cos(rays[i].rayAngle);
      var rayDirY = Math.sin(rays[i].rayAngle);
      //lineHeight = Math.floor(WINDOW_HEIGHT / (rays[i].distance / TILE_SIZE));
      var step = 1.0 * TEX_HEIGHT / lineHeight;
      var texPos = (drawStart - Math.floor(WINDOW_HEIGHT / 2) + Math.floor(lineHeight / 2)) * step;

      if (player.side == 0) {
        wallX = player.y / TILE_SIZE + rays[i].distance / TILE_SIZE * rayDirY;
      } else {
        wallX = player.x / TILE_SIZE + rays[i].distance / TILE_SIZE * rayDirX;
      }
      wallX -= Math.floor(wallX);
      var texX = Math.floor(wallX * TEX_WIDTH);
      if (player.side == 0 && rayDirX > 0)
        texX = TEX_WIDTH - texX - 1;
      if (player.side == 1 && rayDirY < 0)
        texX = TEX_WIDTH - texX - 1;
      
        
      /*for (var y = drawStart; y < drawEnd; y++) {
        var texY = Math.floor(texPos) & (TEX_HEIGHT - 1);
        texPos += step;
        var color = texture[TEX_HEIGHT * texY + texX];
        if (player.side == 1)
          color = (color >> 1) & 8355711;
        buffer[y][Math.floor(rays[i].wallHitX)] = color;
        
      }*/
      // Loop through the x values for the ray
        // Loop through the y values from 0 to lineHeight
          // Get texY
          // Add step to texPos
          // Get color from texture
          // Set the pixel using p5
      var start = WINDOW_WIDTH + i*4;
      
      var end = start + 4;
      var red;
      var green;
      var blue;
      
      //var pixelColor = new p5.Color()
      sketch.stroke(0);
      sketch.rect((i*4) + WINDOW_WIDTH, (drawStart-TILE_SIZE), 0, (drawEnd-drawStart)+TILE_SIZE);
      sketch.stroke(0);
      sketch.rect((i*4) + WINDOW_WIDTH, 0, 0, (drawStart));
      //sketch.stroke(172);
      sketch.rect((i*4) + WINDOW_WIDTH, (drawEnd), 0, WINDOW_HEIGHT);
      sketch.strokeWeight(2);
      for (var x = start; x < end; x++) {
        /*for (var y = 0; y < lineHeight; y++) {
          
          var texY = Math.floor(texPos) & (TEX_HEIGHT - 1);
          texPos += step;
          var color = texture[TEX_HEIGHT * texY + texX];
          if (player.side == 1)
            color = (color >> 1) & 8355711;
          red = color >> 16;
          green = color >> 8 & 255;
          blue = color & 255;
          //pixelColor.setRed(red);
          //pixelColor.setGreen(green);
          //pixelColor.setBlue(blue);
          let colorVal = sketch.color(red, green, blue);
          sketch.set(x, y, colorVal);
          
        }*/
        
        if (x % 2 == 0) {
          sketch.stroke(255, 0 ,0);
        } else {
          sketch.stroke(0, 255 ,0);
        }
        sketch.line(x, drawStart, x, drawEnd);
        
      }
      //sketch.stroke(0);
      /*sketch.rect((i*4) + WINDOW_WIDTH, (drawStart-TILE_SIZE), 0, (drawEnd-drawStart)+TILE_SIZE);
      sketch.stroke(0);
      sketch.rect((i*4) + WINDOW_WIDTH, 0, 0, (drawStart));
      //sketch.stroke(172);
      sketch.rect((i*4) + WINDOW_WIDTH, (drawEnd), 0, WINDOW_HEIGHT);
      sketch.strokeWeight(2);*/
    
    }
    //sketch.updatePixels();
    /*var color = new p5.Color();
    console.log("Here right now");
    for (var y = 0; y < WINDOW_HEIGHT; y++) {
      for (var x = 0; x < WINDOW_WIDTH; x++) {
        var red = buffer[y][x] >> 16;
        var green = buffer[y][x] >> 8 & 255;
        var blue = buffer[y][x] & 255;
        
        color.setRed(red);
        color.setGreen(green);
        color.setBlue(blue);
        set(x, y, color);
      }
    }
    updatePixels();
    console.log("Done!");*/
    //sketch.image(tex, 10, 10);
    //sketch.loadPixels();
    //sketch.updatePixels();
    /*var unusedRays = NUM_RAYS - slider2.value();
    var startVal = WINDOW_WIDTH + slider2.value()*4 - 2;
    //sketch.rect(slider2.value() * 4 + WINDOW_WIDTH, WINDOW_HEIGHT, unusedRays * WINDOW_WIDTH / NUM_RAYS, WINDOW_HEIGHT);
    console.log(WINDOW_HEIGHT);
    sketch.noStroke();
    sketch.fill(0, 0, 0);
    sketch.rect(startVal, 0, unusedRays*4, WINDOW_HEIGHT);
    sketch.describe('white rect with black outline in mid-right of canvas');*/
  }

  window.addEventListener("keydown", function(e) {
    if(["Space","ArrowUp","ArrowDown","ArrowLeft","ArrowRight"].indexOf(e.code) > -1) {
        e.preventDefault();
    }
  }, false);

}

new p5(raycast_textures)