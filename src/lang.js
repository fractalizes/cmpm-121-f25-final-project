export const LANGUAGES = {
  en: {
    controlsMessage: `
      Left click anywhere to move.<br>
      Click a blue ball to collect it.<br>
      Press SPACE to shoot.<br>
      Press U to undo your last action.<br>
      Press K to save game.<br>
      Press L to load game.<br>
      Press X to delete saved game<br>
      Right click and drag to rotate camera.
    `,
    ballCount: (n) => `Balls: ${n}`,
    shootText: `SHOOT`,
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
      Presiona K para guardar el juego.<br>
      Presiona L para cargar el juego.<br>
      Presiona X para borrar la partida guardada.<br>
      Mantén clic derecho para rotar la cámara.
    `,
    ballCount: (n) => `Bolas: ${n}`,
    shootText: `¡disparar!`,
    winMessage: `¡has derribado con éxito el cubo naranja! :D`,
    loseMessage:
      `has perdido, no has derribado el dado naranja y te has quedado sin bolas :(`,
  },

  ch: {
    controlsMessage: `
      左键点击任意位置移动。<br>
      点击蓝色波体以收集。<br>
      按空格键射击。<br>
      按 U 撤销上一步操作。<br>
      按下 K 保存游戏。<br>
      按下 L 加载游戏。<br>
      按下 X 删除存档。<br>
      按住右邊掣同拖曳就可以改變視角。
    `,
    ballCount: (n) => `波數：${n}`,
    shootText: `射波掣`,
    winMessage: `你成功击倒了橙色立方体！ദ്ദി ˉ͈̀꒳ˉ͈́ )✧`,
    loseMessage: `你失败了—球用完了，仍未击倒立方体 (╥﹏╥)`,
  },

  ar: {
    controlsMessage: `
      اضغط بزر الفأرة الأيسر للتحرك.<br>
      اضغط على الكرة الزرقاء لالتقاطها.<br>
      اضغط على مفتاح المسافة لإطلاق الكرة.<br>
      اضغط U للتراجع عن آخر خطوة.<br>
      اضغط K لحفظ اللعبة.<br>
      اضغط L لتحميل اللعبة.<br>
      اضغط X لحذف البيانات المحفوظة.<br>
      اسحب بزر الفأرة الأيمن لتدوير الكاميرا.
    `,
    ballCount: (n) => `الكرات: ${n}`,
    shootText: `رمي الكرة`,
    winMessage: `لقد أسقطت المكعب البرتقالي بنجاح! :D`,
    loseMessage: `لقد خسرت — نفدت الكرات ولم تسقط المكعب :(`,
  },
};
