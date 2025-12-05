export const LANGUAGES = {
  en: {
    controlsMessage: `
      Left click anywhere to move.<br>
      Click a blue ball to collect it.<br>
      Press SPACE to shoot.<br>
      Press U to undo your last action.<br>
      Right click and drag to rotate camera.
    `,
    ballCount: (n) => `Balls: ${n}`,
    winMessage: `you have successfully knocked down the orange cube! :D`,
    loseMessage:
      `you have lost, you have not knocked down the orange cube and ran out of balls :(`,
  },

  es: {
    controlsMessage: `
      Haz clic izquierdo para moverte.<br>
      Haz clic en una bola azul para recogerla.<br>
      Presiona ESPACIO para disparar.<br>
      Presiona U para deshacer la última acción.<br>
      Mantén clic derecho para rotar la cámara.
    `,
    ballCount: (n) => `Bolas: ${n}`,
    winMessage: `¡has derribado con éxito el cubo naranja! :D`,
    loseMessage:
      `has perdido, no has derribado el dado naranja y te has quedado sin bolas :(`,
  },

  ch: {
    controlsMessage: `
      左键点击任意位置移动。<br>
      点击蓝色球体以收集。<br>
      按空格键射击。<br>
      按 U 撤销上一步操作。<br>
      按住右键拖动以旋转镜头。
    `,
    ballCount: (n) => `球数：${n}`,
    winMessage: `你成功击倒了橙色立方体！ :D`,
    loseMessage: `你失败了——球用完了，仍未击倒立方体 :(`,
  },

  ar: {
    controlsMessage: `
      اضغط بزر الفأرة الأيسر للتحرك.<br>
      اضغط على الكرة الزرقاء لالتقاطها.<br>
      اضغط على مفتاح المسافة لإطلاق الكرة.<br>
      اضغط U للتراجع عن آخر خطوة.<br>
      اسحب بزر الفأرة الأيمن لتدوير الكاميرا.
    `,
    ballCount: (n) => `الكرات: ${n}`,
    winMessage: `لقد أسقطت المكعب البرتقالي بنجاح! :D`,
    loseMessage: `لقد خسرت — نفدت الكرات ولم تسقط المكعب :(`,
  },
};
