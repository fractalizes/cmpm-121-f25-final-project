export const LANGUAGES = {

  en: {
    controlsMessage: `
      Left click anywhere to move.<br>
      Click a blue ball to collect it.<br>
      Press SPACE to shoot.<br>
      Right click and drag to rotate camera.
    `,
    ballCount: (n) => `Balls: ${n}`,
    winMessage: `you have successfully knocked down the orange cube! :D`,
    loseMessage: `you have lost, you have not knocked down the orange cube and ran out of balls :(`,
  },

  es: {
    controlsMessage: `
      Haz clic izquierdo para moverte.<br>
      Haz clic en una bola azul para recogerla.<br>
      Presiona ESPACIO para disparar.<br>
      Mantén clic derecho para rotar la cámara.
    `,
    ballCount: (n) => `Bolas: ${n}`,
    winMessage: `¡has derribado con éxito el cubo naranja! :D`,
    loseMessage: `has perdido, no has derribado el dado naranja y te has quedado sin bolas :(`,
  }

};
