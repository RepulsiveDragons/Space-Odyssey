//the player class
class Player extends PIXI.Sprite{
    constructor (x = 0, y = 0) {
        super(app.loader.resources["images/playerShip2_blue.png"].texture);
        this.anchor.set(.5, .5); 
        this.scale.set(0.5);
        this.x = x;
        this.y = y;
    }
}

//class used by any bullets
class Bullet extends PIXI.Sprite{
    constructor(bulletType = "images/laserBlue16.png", x=0, y=0, speed = 500, ydirection= -1, xdirection = 0, rotation = 0){
        super(app.loader.resources[`${bulletType}`].texture);
        this.anchor.set(.5, .5); 
        this.scale.set(0.4);
        this.rotation = rotation;
        this.x = x;
        this.y = y;
        this.fwd = {x: xdirection, y: ydirection};
        this.speed = speed;
        this.isAlive = true;
        Object.seal(this);
    }

    move (dt=1/60){
        this.x += this.fwd.x * this.speed * dt;
        this.y += this.fwd.y * this.speed * dt;
    }
}

//asteroid class
class Asteroid extends PIXI.Sprite{
    constructor(x=0, y=0, direction=1){
        super(app.loader.resources["images/meteorBrown_big3.png"].texture);
        this.anchor.set(.5, .5);
        this.scale.set(0.5);
        this.x = x;
        this.y = y;
        this.fwd = {x:0,y:direction};
        this.speed = 200;
        this.isAlive = true;
        Object.seal(this);
    }

    move (dt=1/60){
        //asteroids move faster if score is greater than 800
        if(score >= 800) {this.speed = 300;}
        this.y += this.fwd.y * this.speed * dt;
    }
}

//enemy class
class Enemy extends PIXI.Sprite{
    constructor(x=0, y=0, direction=1, xDir){
        super(app.loader.resources["images/enemyBlack2.png"].texture);
        this.anchor.set(.5, .5);
        this.scale.set(0.5);
        this.x = x;
        this.y = y;
        this.fwd = {x:xDir,y:direction};
        this.speed = 120;
        this.isAlive = true;
        this.shootCounter = 0;
        Object.seal(this);
    }

    move (dt=1/60){
        //enemies move faster if score is greater than 1000
        if(score >= 1000){this.speed = 200;}

        this.y += this.fwd.y * this.speed * dt;
        if(score >= 500)
        {
            this.x += this.fwd.x * this.speed * dt;
        }  

    }

    //the enemy class own shoot function
    enemyShoot(){
        let enemyBullet = new Bullet("images/laserRed01.png", this.x , this.y + 15, 400, 1)
        enemyBullets.push(enemyBullet);
        gameScene.addChild(enemyBullet);

        //shoots two addition bullets when score is greater than 1000
        if(score >= 1000)
        {
            let b2= new Bullet("images/laserRed01.png", this.x , this.y + 20, 400, 0.7, 0.3, -0.5)
            enemyBullets.push(b2);
            gameScene.addChild(b2);
 

            let b3 = new Bullet("images/laserRed01.png", this.x , this.y + 20, 400, 0.7, -0.3, 0.5)
            enemyBullets.push(b3);
            gameScene.addChild(b3);
        }

        this.shootCounter = 0;
    }

    //bounce the enemy when it hits the edge of the scene
    bounce(){
        this.fwd.x *= -1;
    }
}

//powerup class
class Powerup extends PIXI.Sprite{
    constructor(x=0, y=0, direction=1, texture, powerupId){
        super(app.loader.resources[texture].texture);
        this.anchor.set(.5, .5);
        this.scale.set(1);
        this.x = x;
        this.y = y;
        this.fwd = {x:0,y:direction};
        this.speed = 150;
        this.isAlive = true;
        this.powerupId = powerupId;
        Object.seal(this);
    }

    move (dt=1/60){
        this.y += this.fwd.y * this.speed * dt;
    }
}