"use strict";

window.onload = function()
{
    //disables space bar scrolling
    //since we need space bar to shoot
    window.addEventListener('keydown', function(e) {
        if(e.keyCode == 32 && e.target == document.body) {
          e.preventDefault();
        }
      });
    
    //create the pixi app
    app = new PIXI.Application(
        {
            width: 500,
            height: 600,
            backgroundColor: 0x392F5A,
        }
    );
    
    console.log(app);
    document.querySelector("#stage").appendChild(app.view);
    sceneWidth = app.view.width;
    sceneHeight = app.view.height;
    
    //create event listeners to check when a key is pressed
    window.addEventListener("keydown", keysDown);
    window.addEventListener("keyup", keysUp);
    
    
    //preload images
    app.loader.
    add([
        "images/playerShip2_blue.png",
        "images/playerLife2_blue.png",
        "images/mockup1.png",
        "images/mockup2.png",
        "images/meteorBrown_big3.png",
        "images/laserRed01.png",
        "images/laserBlue16.png",
        "images/enemyBlack2.png",
        "images/blue.png",
        "images/bolt_gold.png",
        "images/pill_blue.png",
        "images/things_silver.png",
        "images/explosion_sheet.png"
    ]);
    app.loader.onComplete.add(setup);
    app.loader.load();

}

//global variables
let app;
let loader;
let stage;
let sceneWidth;
let sceneHeight;
let keys = {};

let startScene;
let gameScene, player, shipDamage1, shipDamage2, shipDamage3;
let shootSound, gameOverSound, takeDamageSound, startGameSound, powerUp, explosion, explosionSheet;
let gameOverScene;
let paused = true;
let counter = 0;
let attackSpeed = 60;
let spawnCounter = 0;
let enemySpawnCounter = 0;
let enemyShootCounter = 40;
let asteroidSpawnThreshold = 2;
let enemySpawnThreshold = 4;
let spawnChance = 50;
let enemySpawnChance = 50;
let score = 0;
let lives = 5;
let boltBuff = 0;
let boltCounter = 0;
let pillBuff = false;
let pillCounter = 0;
let pillTimer = 0;
let silverBuff = false;
let silverCounter = 0;
let silverTimer = 0;


let bullets = [];
let asteroids = [];
let enemys = [];
let enemyBullets = [];
let powerups = [];
let explosions = [];


//sets up the scenes
function setup()
{
  stage = app.stage;

  //create start scene
  startScene = new PIXI.Container();
  startScene.visible = true;
  stage.addChild(startScene);  

  //create game scene
  gameScene = new PIXI.Container();
  gameScene.visible = false;
  stage.addChild(gameScene);

  //create game over scene
  gameOverScene = new PIXI.Container();
  gameOverScene.visible = false;
  stage.addChild(gameOverScene);

  createScene();  

  //create the player ship
  player = new Player(sceneWidth/2, sceneHeight/2);
  
  //sprites that show the ship has been damaged
  shipDamage1 = new PIXI.Sprite.from('images/playerShip2_damage1.png');
  shipDamage1.anchor.set(0.5);
  shipDamage1.scale.set(0.5);
  shipDamage2 = new PIXI.Sprite.from('images/playerShip2_damage2.png');
  shipDamage2.anchor.set(0.5);
  shipDamage2.scale.set(0.5);
  shipDamage3 = new PIXI.Sprite.from('images/playerShip2_damage3.png');
  shipDamage3.anchor.set(0.5);
  shipDamage3.scale.set(0.5);


  //set up our sounds
  shootSound = new Howl({
    src: ['sounds/sfx_laser1.mp3']
  });

  gameOverSound = new Howl({
    src: ['sounds/sfx_lose.mp3']
  });

  takeDamageSound = new Howl({
    src: ['sounds/sfx_shieldDown.mp3']
  });

  startGameSound = new Howl({
    src: ['sounds/sfx_twoTone.mp3']
  })

  powerUp = new Howl ({
      src: ['sounds/sfx_shieldUp.mp3']
  })

  explosion = new Howl ({
      src: ['sounds/explosion.mp3'],
      volume: 0.15
  })

  //add the player and the other sprites to the game scene
  gameScene.addChild(player);
  gameScene.addChild(shipDamage1);
  gameScene.addChild(shipDamage2);
  gameScene.addChild(shipDamage3);

  explosionSheet = createSpriteSheet();

  //start game loop
  app.ticker.add(gameLoop);
}

//the main game loop
function gameLoop()
{

    if(paused) return;
    //calculate delta time
	let dt =1/app.ticker.FPS;
    if(dt > 1/12) dt = 1/12;

    if(lives <= 0) {gameOver();}

    //difficulty scaling based on the current score
    //increases how often enemies and asteroids will spawn
    if(score >= 200)
    {
        asteroidSpawnThreshold = 1;
        enemySpawnThreshold = 3;
        spawnChance = 50;
        enemySpawnChance = 60;
    }

    if(score > 800)
    {
        spawnChance = 100;
        enemySpawnThreshold = 2;
    }

    if(score > 1200)
    {
        asteroidSpawnThreshold = 0.5;
        enemySpawnChance = 100;
    }

    PlayerMovement();
    ClampPlayer();

    //set a counter for when the player can shoot again
    counter += 1;
    if(counter >= attackSpeed)
    {
        Shoot();
    }

    //spawns asteroids based on a timer
    spawnCounter += 1 * dt;
    if(spawnCounter >= asteroidSpawnThreshold)
    {
        spawnAsteroids();
    }

    //spawns enemies based on a timer
    enemySpawnCounter += 1 *dt;
    if(enemySpawnCounter >= enemySpawnThreshold)
    {
        spawnEnemys();
    }

    //move bullets
    for (let bullet of bullets) {
        bullet.move(dt);

        if(bullet.y < -10) {bullet.isAlive = false; gameScene.removeChild(bullet);}
    }


    //move asteroids
    for (let asteroid of asteroids) {
        asteroid.move(dt);

        if(asteroid.y > sceneHeight + 50) {asteroid.isAlive = false; gameScene.removeChild(asteroid);}
    }
    
    //move enemys 
    for (let enemy of enemys) {
        enemy.move(dt);

        if(enemy.x > sceneWidth - enemy.width/2 || enemy.x < 0 + enemy.width/2){
            enemy.bounce();
        }

        //a timer for enemy shots
        enemy.shootCounter += 1 * dt;
        if(enemy.shootCounter >= 0.9)
        {
            enemy.enemyShoot();
        }

        if(enemy.y > sceneHeight + 50) {enemy.isAlive = false; gameScene.removeChild(enemy);}
    }

    //move enemy bullets
    for (let bullet of enemyBullets) {
        bullet.move(dt);

        if(bullet.y < -10) {bullet.isAlive = false; gameScene.removeChild(bullet);}
    }

    //move powerups
    for (let powerup of powerups) {
        powerup.move(dt);
        if(powerup.y >sceneHeight + 50) {powerup.isAlive = false; gameScene.removeChild(powerup);}
    }

    asteroidCollisions();
    enemyCollisions();
    enemyBulletCollisions();
    powerupCollisions();
    takenDamage();

    //clear any dead sprites from the scene
    bullets = bullets.filter(bullet => bullet.isAlive);
    asteroids = asteroids.filter(asteroid => asteroid.isAlive);
    enemys = enemys.filter(enemy => enemy.isAlive);
    enemyBullets = enemyBullets.filter(enemyBullet => enemyBullet.isAlive);
    powerups = powerups.filter(powerup => powerup.isAlive);
    explosions = explosions.filter(e => e.playing);

    //spawns powerups based on a timer and a percentage
    boltCounter += 1 *dt;
    if(boltBuff < 5)
    {
        if(boltCounter >= 6)
        {
            spawnPowerup(20, "images/bolt_gold.png", 1);
        }
    }

    pillCounter += 1 *dt;
    if(pillCounter >= 11)
    {
        spawnPowerup(30, "images/pill_blue.png", 2);
    }

    silverCounter += 1 *dt;
    if(silverCounter >= 16)
    {
        spawnPowerup(30, "images/things_silver.png", 3)
    }
    
    //changes the dom to reflect the correct times
    if(pillTimer > 0)
    {
        document.querySelector("#pill").innerHTML = `${Math.trunc(pillTimer)}`;
        pillTimer -= 1 * dt;
    }
    else{pillBuff = false;}

    if(silverTimer > 0)
    {
        document.querySelector("#things").innerHTML = `${Math.trunc(silverTimer)}`;
        silverTimer -= 1 *dt;
    }
    else{silverBuff = false;}

}

//gets the key pressed and move the player accordingly
function PlayerMovement()
{
    if(keys["87"]) //w
    {
        player.y -= 3;
    }
    if(keys["65"]) //a
    {
        player.x -= 3;
    }
    if(keys["83"]) //s
    {
        player.y += 3;
    }
    if(keys["68"]) //d
    {
        player.x += 3;
    }
}

//set whether a key is being pressed
function keysDown(e)
{
    keys[e.keyCode] = true;
}
function keysUp(e)
{
    keys[e.keyCode] = false;
}

//keeps the player on the screen
function ClampPlayer()
{
    player.x = clamp(player.x, 0+player.width/2, sceneWidth - player.width/2);
    player.y = clamp(player.y, 0+player.height/2, sceneHeight - player.height/2);
}

//shoot a bullet when space bar is pressed
//shoot additional bullets if the player has powerups
function Shoot(){
    if(keys["32"])
    {
        let bullet1 = new Bullet("images/laserBlue16.png", player.x , player.y -15, 700, -1)
        bullets.push(bullet1);
        gameScene.addChild(bullet1);
        if(pillBuff)
        {
            let bullet2 = new Bullet("images/laserBlue16.png", player.x - 25, player.y -5, 700, -1)
            bullets.push(bullet2);
            gameScene.addChild(bullet2);
            let bullet3 = new Bullet("images/laserBlue16.png", player.x + 25, player.y -5, 700, -1)
            bullets.push(bullet3);
            gameScene.addChild(bullet3);
        }
        if(silverBuff)
        {
            let bullet4 = new Bullet("images/laserBlue16.png", player.x +10, player.y -15, 700, -0.7, 0.3, 0.5)
            bullets.push(bullet4);
            gameScene.addChild(bullet4);
            let bullet5 = new Bullet("images/laserBlue16.png", player.x - 10 , player.y -15, 700, -0.7, -0.3, -0.5)
            bullets.push(bullet5);
            gameScene.addChild(bullet5);
        }
        counter = 0;
        shootSound.play();
    }
}

//spawns an asteroid at a random location in the stage
function spawnAsteroids()
{
    //get a random interger
    //has a percent chance of being spawned
    let randomInt = Math.trunc(getRandom(1,100));
    if(randomInt <= spawnChance)
    {
        let asteroid = new Asteroid(getRandom(50,sceneWidth-50), -30, 1)
        asteroids.push(asteroid);
        gameScene.addChild(asteroid);
        spawnCounter = 0;
    }
}


//same thing as spawnAteroids()
function spawnEnemys() {
    let randomInt = Math.trunc(getRandom(1,100));
    
    if(randomInt <= enemySpawnChance)
    {
        let enemy = new Enemy(getRandom(50,sceneWidth-50), -30, 1, Math.round(getRandom(-1,1)))
        enemys.push(enemy);
        gameScene.addChild(enemy);
        enemy.enemyShoot();
        enemySpawnCounter = 0;
    }
}

//same thing as above
function spawnPowerup(percent = 10, image, powerupId)
{
    let randomInt = Math.round(getRandom(1,100));
    if(randomInt <= percent)
    {
       let powerup = new Powerup(getRandom(50,sceneWidth-50), -30, 1, image, powerupId);
       powerups.push(powerup);
       gameScene.addChild(powerup);
    }
    //resets the correct counter based on its powerup id
    if(powerupId == 1)
    {
        boltCounter = 0;
    }

    if(powerupId == 2)
    {
        pillCounter = 0;
    }

    if(powerupId == 3)
    {
        silverCounter = 0;
    }
}

//checks for collisions between asteroid, the players bullets, and the player
function asteroidCollisions(){
        //check for bullet and asteroid collisions
        for (let asteroid of asteroids) {
            for (let bullet of bullets) {
                if(rectsIntersect(asteroid,bullet))
                {
                    gameScene.removeChild(asteroid);
                    asteroid.isAlive = false;
                    gameScene.removeChild(bullet);
                    bullet.isAlive = false;
                    score += 10;
                    document.querySelector("#score").innerHTML = `${score}`;
                }
            }
            //player collision with asteroids
            if(rectsIntersect(asteroid,player))
            {
                gameScene.removeChild(asteroid);
                asteroid.isAlive = false;
                lives -= 1;
                document.querySelector("#lives").innerHTML = `${lives}`;
                takeDamageSound.play();
            }
            
        }
}

//checks for collisons between enemies and the player
function enemyCollisions(){
        //check collision between enemies and the players bullets
        for (let enemy of enemys) {
            for (let bullet of bullets) {
                if(rectsIntersect(enemy,bullet))
                {
                    gameScene.removeChild(enemy);
                    enemy.isAlive = false;
                    gameScene.removeChild(bullet);
                    bullet.isAlive = false;
                    score += 30;
                    document.querySelector("#score").innerHTML = `${score}`;
                    explosion.play();
                    createExplosion(enemy.x, enemy.y, 71.11111111111, 67);
                }
            }
            //player collision with enemies
            if(rectsIntersect(enemy,player))
            {
                gameScene.removeChild(enemy);
                enemy.isAlive = false;
                lives -= 1;
                document.querySelector("#lives").innerHTML = `${lives}`;
                takeDamageSound.play();
            }
            
        }
}

//check collisions between enemy bullets and the player
function enemyBulletCollisions(){
    for (let bullet of enemyBullets) {
        if(rectsIntersect(bullet,player))
        {
            gameScene.removeChild(bullet);
            bullet.isAlive = false;
            lives -=1;
            document.querySelector("#lives").innerHTML = `${lives}`;
            takeDamageSound.play();
        }
    }
}

//checks collisions between the player and powerups
function powerupCollisions(){
    for (let powerup of powerups) {
        if(rectsIntersect(powerup,player))
        {
            gameScene.removeChild(powerup);
            powerup.isAlive = false;

            //give the respective buff 
            if(powerup.powerupId == 1)
            {
                boltBuff += 1;
                document.querySelector("#bolt").innerHTML = `${boltBuff}`;
                attackSpeed -= 6;
            }
            if(powerup.powerupId == 2)
            {
                pillTimer += 20;
                pillBuff = true;
            }
            if(powerup.powerupId == 3)
            {
                silverTimer += 20;
                silverBuff= true;
            }
            powerUp.play();
        }
    }
}

//adds a sprite on top of the player sprite to make it 
//look like the players ship took damage
function takenDamage()
{
    if(lives == 4)
    { shipDamage1.x = player.x; shipDamage1.y = player.y;}
    else
    { shipDamage1.x = -300;shipDamage1.y = -300;}
    
    if(lives <= 3 && lives > 1)
    { shipDamage2.x = player.x; shipDamage2.y = player.y;}
    else
    {shipDamage2.x = -300; shipDamage2.y = -300;}

    if(lives == 1)
    { shipDamage3.x = player.x; shipDamage3.y = player.y;}
    else
    { shipDamage3.x = -300; shipDamage3.y = -300;}
    
}

//create a list of sprites from a sprite sheet
function createSpriteSheet()
{
    let sheet = new PIXI.BaseTexture.from("images/explosion_sheet.png")
    let width = 71.11111111111;
    let height = 67;
    let numFrames = 63;
    let textures = [];

    //nested loop to get through each individual sprite
    for(let h= 0; h<7; h++)
    {
        for(let w = 0; w<9; w++)
        {
            let frame = new PIXI.Texture(sheet, new PIXI.Rectangle(w*width, h*height, width, height))
            textures.push(frame);
        }
    }
    return textures;
}

//creates the explosion animation
function createExplosion(x,y,frameWidth,frameHeight)
{
    let w2 = frameWidth /2;
    let h2 = frameHeight /2;
    let animation = new PIXI.AnimatedSprite(explosionSheet);
    animation.x= x - w2;
    animation.y= y - h2;
    animation.animationSpeed = 1;
    animation.loop = false;
    animation.onComplete = e => gameScene.removeChild(animation);
    explosions.push(animation);
    gameScene.addChild(animation);
    animation.play();
}

//set up the elements in each scene
function createScene()
{
    //title element for the start scene
    let title = new PIXI.Text("Space Odyssey")
    title.style = new PIXI.TextStyle({
        fill:0xFFFFFF,
        fontSize: 40,
        fontFamily: 'kenvector_future_thinregular',
        stroke: 0xFF0000,
        strokeThickness: 3
    })

    title.x = 60;
    title.y = 140;
    startScene.addChild(title);

    //start button element for the start scene
    let startButton = new PIXI.Text("Start")
    startButton.style = new PIXI.TextStyle({
        fill: 0x0000FF,
        fontSize: 30,
        fontFamily: 'kenvector_future_thinregular',
    })
    startButton.x = 200;
    startButton.y = 500;
    startButton.interactive = true;
    startButton.buttonMode = true;
    startButton.on("pointerup", startGame); 
    startButton.on('pointerover', e => e.target.alpha = 0.7);
    startButton.on('pointerout', e => e.currentTarget.alpha = 1.0); 
    startScene.addChild(startButton);

    //create a background that consists of tiles of one image
    let background = new PIXI.TilingSprite(app.loader.resources["images/blue.png"].texture, 500,600);
    background.position.set(0,0);
    gameScene.addChild(background);

    //game over text for game over scene
    let gameover = new PIXI.Text("Game Over")
    gameover.style = new PIXI.TextStyle({
        fill:0xFF0000,
        fontSize: 50,
        fontFamily: 'kenvector_future_thinregular',
        stroke: 0xFFFFFF,
        strokeThickness: 3
    })
    gameover.x = 85;
    gameover.y = 140;
    gameOverScene.addChild(gameover);

    //play again button for the game over scene
    let playAgainButton = new PIXI.Text("Play Again")
    playAgainButton.style = new PIXI.TextStyle({
        fill: 0x0000FF,
        fontSize: 30,
        fontFamily: 'kenvector_future_thinregular',
    })
    playAgainButton.x = 150;
    playAgainButton.y = 500;
    playAgainButton.interactive = true;
    playAgainButton.buttonMode = true;
    playAgainButton.on("pointerup", startGame); 
    playAgainButton.on('pointerover', e => e.target.alpha = 0.7);
    playAgainButton.on('pointerout', e => e.currentTarget.alpha = 1.0); 
    gameOverScene.addChild(playAgainButton);
}

//resets the variables to its defaults and start the game
function startGame(){
    startScene.visible = false;
    gameScene.visible = true;
    gameOverScene.visible = false;
    counter = 0;
    attackSpeed = 60;
    spawnCounter = 0;
    enemySpawnCounter = 0;
    enemyShootCounter = 40;
    asteroidSpawnThreshold = 2;
    enemySpawnThreshold = 4;
    spawnChance = 50;
    enemySpawnChance = 50;
    score = 0;
    lives = 5;
    boltBuff = 0;
    boltCounter = 0;
    pillBuff = false;
    pillCounter = 0;
    pillTimer = 0;
    silverBuff = false;
    silverCounter = 0;
    silverTimer = 0;
    document.querySelector("#score").innerHTML = score;
    document.querySelector("#lives").innerHTML = lives;
    document.querySelector("#bolt").innerHTML = boltBuff;
    document.querySelector("#pill").innerHTML = pillTimer;
    document.querySelector("#things").innerHTML = silverTimer;

    bullets = [];
    asteroids = [];
    enemys = [];
    enemyBullets = [];
    powerups = [];
    player.x = sceneWidth/2;
    player.y = sceneHeight/2;
    paused = false;  
    console.log(startGameSound);
    startGameSound.play();
}

//switchs to the game over scene
function gameOver(){
    paused = true;
    startScene.visible = false;
    gameScene.visible = false;
    gameOverScene.visible = true;
    clearScene();
    gameOverSound.play()

}

//clears any sprites off of the game scene
function clearScene(){
    
    for (let object of bullets) {
        gameScene.removeChild(object);
    }

    for (let object of asteroids) {
        gameScene.removeChild(object);
    }

    for (let object of enemys) {
        gameScene.removeChild(object);
    }

    for (let object of enemyBullets) {
        gameScene.removeChild(object);
    }

    for (let object of powerups) {
        gameScene.removeChild(object);
    }

    for (let object of explosions) {
        gameScene.removeChild(object);
    }
}


