# Galaxy Engine
<p align="center">
  <img src="demo/demo.gif" width="75%">
</p>
Galaxy Engine is a two-dimensional gravity simulator based on <a href=" https://en.wikipedia.org/wiki/Newton%27s_law_of_universal_gravitation">Newton's law of universal gravitation</a>. This simulator is part of an educational web application, trying to provide a minimal interactive demonstration of how gravity works in large scales. The simulator is written in JavaScript and is compatible with all the modern browsers. However, Galaxy Engine is not just a humble simulator! It is a complete web application. In the following I explain it in more detail.

# Code Structure

## Backend

The backend script, [galaxy.js](galaxy.js), contains 3 main components; the `Projectile` class is responsible for any physical object inside the simulator; the `galaxy` object controls the simulator’s behavior; and the `physics` function is where the magic happens! The coding is descriptive and different blocks are labeled properly.

## Front-End

The front-end script, [main.js](main.js), contains manages the GUI behavior. It is composed of 4 elements; the `mainProfile` object is responsible for graphical representation of a physical object inside the simulator; the `selectProfile` is responsible for controlling the physical object that is currently selected; the `dragProfile` manages the drag behavior of the simulation board; and the `scaleProfile`manages the scaling behavior of the simulation board. The rest of this file contains typical DOM management codes.

# GUI

## Board
The board contains the physical objects and is actually where the simulation happens. It can be dragged or scaled using typical mouse commands.
## Upper Bar
The upper bar, which appears only if a physical object is selected, provides tools for managing different properties of the selected object:
1. Name. The identifier of the object.
2. Material. Graphically, the color of the object, but this property actually defines affects the behavior of the object during a collision or explosion.
3. Mass: The physical mass of the object, which is responsible for the amount of gravitational force that it exerts on other objects.
4. Temperature:
5. Speed:
6. Direction:
7. Origin:
8. Remove Button:
9. Revert Button:
10. 

## Lower Bar

