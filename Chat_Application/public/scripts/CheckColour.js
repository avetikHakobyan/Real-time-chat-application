 //Generates and returns a random 6-digit hexadecimal number as a string
 //This number will correspond to a RGB colour code
let randomColour = () => Math.floor(Math.random()*16777215).toString(16);

//Determines the perceptible difference between two colours
//Returns true if there is a sufficient differnce between the colours
//as can be perceived by the human eye, false otherwise
let areDifferent = (colour1, colour2) => {
    let r1 = colour1.substring(0,2);
    let g1 = colour1.substring(2,4);
    let b1 = colour1.substring(4);

    let r2 = colour2.substring(0,2);
    let g2 = colour2.substring(2,4);
    let b2 = colour2.substring(4);

    let rnum1 = parseInt(r1, 16);
    let gnum1 = parseInt(g1, 16);
    let bnum1 = parseInt(b1, 16);
    let rnum2 = parseInt(r2, 16);
    let gnum2 = parseInt(g2, 16);
    let bnum2 = parseInt(b2, 16);

    return (Math.sqrt((rnum1 - rnum2)**2 + (gnum1 - gnum2)**2 + (bnum1 - bnum2)**2)) > 75;
}