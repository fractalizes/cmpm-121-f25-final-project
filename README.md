# Devlog Entry – [11/14/25]

## The Team! Austin Mendoza, Dominic Umbrasas, Ian Bunsirisert, Aaron Chen

- **Tools Lead:** Austin
- **Engine Lead:** Ian
- **Design Lead:** Dominic
- **Testing Lead:** Aaron

## Tools and Materials

### Engine:
We will be using the [baseline](https://web.dev/baseline) web browser because we are all familiar with it and we can easily bring in TypeScript/JavaScript libraries to implement 3D graphics, rendering, and physics. For the 3D libraries, we will be relying on [three.js](https://threejs.org/) and [ammo.js](https://github.com/kripken/ammo.js). It looks like there is a lot of documentation and tutorials on how to set everything up and a large community for these two libraries, so we can most likely find help here if nobody in our group or class is able to help us with a super specific problem.

### Languages:
The main languages that we are using throughout the project are JavaScript and TypeScript, as well as JSON. We are all confident with these scripting languages, and JSON is readable and it is very easy to read and write JSON data with JavaScript and TypeScript. We may use different data languages like XML or YAML, but sticking with JSON is preferable.

### Tools:
The tools that we expect to use within the project are [VSCode](https://code.visualstudio.com/) and [GitHub Codespaces](https://github.com/features/codespaces). The reason why we chose these two IDE tools is because we are already very familiar with both platforms and both are very easy to use and access. We are also planning to use [Deno](https://deno.com/) as our JavaScript runner and TypeScript compiler. For asset creation, we plan on using [PixilArt](https://www.pixilart.com/) editor, because we are pretty familiar with it from using it in CMPM 80K and CMPM 120.

### Generative AI:
We do not plan to heavily rely on GenAI or any agentic tools for this project. However, we may use GenAI like [BayLeaf’s Brace](https://bayleaf.chat/?model=brace-85291) for debugging purposes and/or give us tips on how to implement certain aspects and refactoring. It has been proven effective for analyzing TypeScript/JavaScript code and helpful for debugging Demo assignment code.

## Outlook
We believe the hardest part is definitely learning about how the [three.js](https://threejs.org/) and [ammo.js](https://github.com/kripken/ammo.js) libraries and how they both function and correlate with one another, given how little time we have. We believe that by approaching the project with the tools and materials we selected above, we will learn how to develop more flexibly and how to manage our time consumption, as well as reserving ourselves to what we want to implement into the game. We will also learn when to cut our losses due to the time constraints.

# Devlog Entry - [11/21/25]

## How we Satisfied the Software Requirements

We used JavaScript as our language platform, which does not natively provide support for 3D rendering and physics simulation. For those, we imported two libraries: three.js for rendering our 3D environment and objects and ammo.js for our physics simulation. Our current iteration has the player play as a red ball and can control using WASD. We will change this to a point-and-click somewhere down the road, but this is just for testing the engine and having a submittable product. The player wins by knocking down the orange cube and loses by running out of balls to shoot, which is three. An alert popup shows up on the player screen for the win or loss message. Although scrappy, we will obviously change this in the future and only here as a placeholder. We are using deno for autoformatting and linting. We are also using GitHub's deploy.yml for automatic packaging and deployment.

## Reflection
Instead of relying on some TypeScript and some JavaScript, we decided to fully rely on JavaScript because our ammo.js and three.js libraries do not support this. Although there is some documentation on people getting TypeScript to work with these three libraries, the documentation we found for it was old (like this [WebGL-Shooter](https://github.com/hvidal/WebGL-Shooter) from years ago) and we could not find more recent documentation or example builds using TypeScript with our libraries. Because JavaScript is a lot more loose when it comes to running code, like not having strong/static typing functionality and not having to be compiled before running, we could run into issues down the line where it will be a lot harder to find and isolate issues. This means we have to be a lot more careful about what we are writing, changing, and makes refactoring a lot more important to be able to understand and fix these issues quickly before more spring up down the line.

# Devlog Entry - [12/1/25]

## How we Satisfied the Software Requirements

We are still using JavaScript, which does not natively support 3D rendering and physics simulation, and relying on libraries ammo.js and three.js for these requirements. In our current iteration, the player can move their character by clicking on the ground and they will roll towards that position at a set speed. With this, we added a door to the environment that teleports the player to the next room. The player can also move around the world and collect balls to shoot by clicking on it. Our inventory system reflects this by having a HUD indicator on the top right corner and memory of how many balls the player has retains when moving to the next room. The win and lose conditions are the same as last time, which is knocking down the orange cube by shooting balls. However, you now have to collect balls in the first room and the orange cube has been moved to the second room. These are the two conclusive endings currently, but we are planning to revise these endings for the next assignment.

## Reflection
Our plans have remained mostly the same. We correctly predicted that using JavaScript instead of TypeScript would cause issues when working with developing our game, due to having no strong/static typing functionality, compilation, etc. that makes debugging and refactoring more difficult. However, we think we have done mostly well with what we are working with, which is constantly refactoring and cleaning up code. We think the largest plan change this time around is dividing up how much work each team member should do, as well as understanding each other's coding and/or logic. Next time around, we came to the conclusion to try to add comments on specific lines if they are not easy to understand or read, or outright revise the logic to be more easily understandable or readable.

# Devlog Entry - [12/5/25]

## Selected Requirements
- **[Save System]** Support multiple save points as well as an auto-save feature so that the player cannot lose progress by accidentally closing the game app.
- **[Touchscreen]** Support touchscreen-only gameplay (no requirement of mouse and keyboard).
- **[I18N + L10N]** Support three different natural languages including English, a language with a logographic script (e.g. 中文), and a language with a right-to-left script (e.g. العربية).
- **[Unlimited Undo]** Support unlimited levels of undo of the major play actions (such as moving to a scene or interacting with a specific object, but don't worry about undo within a physics interaction).

## How we Satisfied the Software Requirements
For save system, we used localStorage, used a constant string as our key, and turned our save data as a JSON to save it onto our localStorage. We then used various functions to help save, load, and delete our saves. Because our game turned our movement from WASD controls to point-and-click controls, we did not have to worry about that anymore when helping convert our controls to be mobile friendly. However, the data saving, loading, deleting data, shooting, and undoing features were all keyboard focused. So, we created a function that detects whether the player is on a mobile device or not. If detected, then call a function that creates buttons that replicate all those features so no keybinds are required to play the game. However, we also had to worry about right-click because that was how our player controls the camera. To fix this, we made it so the camera constantly hovers the player's movement if it is detected they are on a mobile device. For support of three different natural languages, we created an `lang.js` that acts a bit like a JSON file, which stores all of our translations and is called whenever text is displayed. Lastly, we used a stack to store all of the player's actions and pops it and restores the previous gamestate when the player undos an action.

## Reflection
Previously, we did not include comments on what we have done and our communication had been rather sparse. Now, it has definitely gotten better and helped us understand our individual thought processes and logic more, as well as help us plan better towards how to tackle the F3 requirements. It also helps us keep our code neat, concise, and also help with refactoring because we no longer have to guess and check each other's work. Furthermore, because we were able to communicate better, our productivity has increased because we know what each person has to do towards the F3 requirements, meaning we do not have to interrupt each other's work and/or accidentally introduce unsuspecting bugs.