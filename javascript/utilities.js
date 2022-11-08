//function to get a random float between the min and max value
function getRandom(min, max) {
    return Math.random() * (max - min) + min;
}

//checks for intersections using 
//the sprites bounding boxes
function rectsIntersect(a,b){
    let objectA = a.getBounds();
    let objectB = b.getBounds();
    return objectA.x + objectA.width > objectB.x && objectA.x < objectB.x + objectB.width && objectA.y + objectA.height > objectB.y && objectA.y < objectB.y + objectB.height;
}

//clamp the player to the scene width and height
function clamp(val, min, max){
    return val < min ? min : (val > max ? max : val);
}