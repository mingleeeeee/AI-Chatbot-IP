var app;

// PixiJS
var {
  Application, Sprite, Texture, live2d: { Live2DModel }
} = PIXI;

// Kalidokit
var {
  Face, Vector: { lerp }, Utils: { clamp }
} = Kalidokit;

// 1, Live2Dモデルへのパスを指定する
var modelUrl = "assets/chiikawa.model3.json";
var currentModel;

// メインの処理開始
(async function main() {
  // 2, PixiJSを準備する
  app = new PIXI.Application({
    view: document.getElementById("my-live2d"),
    autoStart: true,
    backgroundAlpha: 0,
    resizeTo: window
  });

  // 3, 背景画像をロードして追加する
  const backgroundTexture = Texture.from('static/school.jpeg'); // Replace with the path to your background image
  const backgroundSprite = new Sprite(backgroundTexture);
  backgroundSprite.width = window.innerWidth;
  backgroundSprite.height = window.innerHeight;
  app.stage.addChild(backgroundSprite);

  // 4, Live2Dモデルをロードする
  currentModel = await Live2DModel.from(modelUrl, { autoInteract: false });

  // Set the scale to adjust the height proportionally
  const desiredHeight = 650; // Desired height in pixels
  const scale = desiredHeight / currentModel.height;

  currentModel.scale.set(scale); // Adjusting the scale proportionally
  
  currentModel.anchor.set(0.5, 0.5); // モデルのアンカー★
  currentModel.position.set(window.innerWidth / 2, desiredHeight / 0.98); // モデルの位置★

  // 6, Live2Dモデルを配置する
  app.stage.addChild(currentModel);

  window.addEventListener('resize', () => {
    backgroundSprite.width = window.innerWidth;
    backgroundSprite.height = window.innerHeight;
    currentModel.position.set(window.innerWidth / 2, desiredHeight / 2);
  });

})();
