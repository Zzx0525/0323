let grasses = [];
let bubbles = []; // 新增氣泡陣列
let fishes = [];  // 新增小魚陣列
const colors = ['#ffbe0b', '#fb5607', '#ff006e', '#8338ec', '#3a86ff'];

function setup() {
  // 採用全螢幕畫布
  let cnv = createCanvas(windowWidth, windowHeight);
  cnv.style('position', 'absolute');
  cnv.style('top', '0');
  cnv.style('left', '0');
  cnv.style('z-index', '1');
  cnv.style('pointer-events', 'none'); // 讓畫布不阻擋滑鼠點擊，使後方網頁能正常操作
  
  // 產生滿版的 iframe，並放在畫布後方
  let iframe = createElement('iframe');
  iframe.attribute('src', 'https://www.et.tku.edu.tw/main.aspx');
  iframe.style('position', 'absolute');
  iframe.style('top', '0');
  iframe.style('left', '0');
  iframe.style('width', '100%');
  iframe.style('height', '100%');
  iframe.style('z-index', '-1');
  iframe.style('border', 'none');

  // 初始化 50 根小草的顏色與各項隨機屬性
  for (let i = 0; i < 50; i++) {
    let c = color(random(colors));
    c.setAlpha(random(120, 200)); // 為水草顏色加入隨機的透明度 (Alpha值)
    
    grasses.push({
      c: c,
      noiseOffset: random(1000), // 給予不同的隨機值，讓搖晃頻率錯開
      weight: random(30, 60),    // 線條寬度在 30 到 60 之間
      heightRatio: random(0.15, 0.4), // 降低水草的高度比例，最高不超過視窗高度的 40%
      xRatio: random(1),         // 隨機 X 座標比例，讓水草能自然地重疊在一起
      speed: random(0.002, 0.015), // 每根水草專屬的搖晃速度
      amp: random(100, 250)      // 每根水草的搖晃幅度與方向範圍
    });
  }
  
  // 初始化 40 個半透明氣泡
  for (let i = 0; i < 40; i++) {
    bubbles.push({
      xRatio: random(1),       // 用比例來設定 X 座標，方便視窗縮放時適應
      y: random(windowHeight), // 初始隨機 Y 座標
      size: random(8, 25),     // 氣泡大小
      speed: random(1, 3),     // 往上飄動的速度
      noiseOffset: random(1000),// 用於左右微幅搖晃的隨機值
      popY: random(windowHeight * 0.1, windowHeight * 0.8), // 隨機設定破掉的高度
      isPopping: false,        // 記錄水泡是否正在破裂狀態
      popRadius: 0,            // 記錄破裂動畫的半徑
      popAlpha: 0              // 記錄破裂動畫的透明度
    });
  }
  
  // 初始化 15 條小魚
  for (let i = 0; i < 15; i++) {
    let dir = random() > 0.5 ? 1 : -1; // 隨機決定向左或向右游 (-1 或 1)
    fishes.push({
      x: random(windowWidth),
      y: random(windowHeight * 0.1, windowHeight * 0.8),
      size: random(10, 25),      // 小魚的大小
      speed: random(1, 3) * dir, // 加上方向的游動速度
      c: color(random(colors)),  // 隨機顏色
      noiseOffset: random(1000)  // 用於游動時上下微幅擺動的變數
    });
  }
}

function draw() {
  // 先清除畫布上的舊像素，避免半透明背景隨時間疊加成不透明
  clear();
  // 將背景顏色設定為淡藍色，並加上 0.2 的透明度 (255 * 0.2 ≒ 51)
  background(173, 216, 230, 51);
  
  // 繪製由上往下照射的光影特效 (God Rays)
  blendMode(SCREEN); // 使用 SCREEN 讓光束自然地提亮背景
  noStroke();
  for (let i = 0; i < 10; i++) {
    // 利用 noise 產生緩慢改變的透明度，創造光線在水中閃爍穿透的感覺
    let alpha = map(noise(i * 10, frameCount * 0.005), 0, 1, 0, 40);
    fill(255, 255, 255, alpha);
    
    // 計算光束頂部和底部的 X 座標，讓它有微微的隨機搖晃與傾斜
    let topX = map(i, 0, 9, -width * 0.2, width * 1.2);
    let bottomX = topX + map(noise(i * 20, frameCount * 0.003), 0, 1, -width * 0.3, width * 0.3);
    
    // 設定頂部與底部的寬度 (光線向下通常會稍微散射變寬)
    let topWidth = map(noise(i * 30), 0, 1, 20, 80);
    let bottomWidth = topWidth * map(noise(i * 40), 0, 1, 1.5, 4);
    
    beginShape();
    vertex(topX - topWidth, 0);
    vertex(topX + topWidth, 0);
    vertex(bottomX + bottomWidth, height);
    vertex(bottomX - bottomWidth, height);
    endShape(CLOSE);
  }
  
  blendMode(BLEND); // 恢復 BLEND 模式，供後續氣泡與水草正常繪製
  
  // 繪製與更新小魚
  noStroke();
  for (let i = 0; i < fishes.length; i++) {
    let f = fishes[i];
    
    // 預先計算小魚目前的 Y 座標 (加上上下起伏的 noise)
    let yWobble = map(noise(f.noiseOffset, frameCount * 0.02), 0, 1, -15, 15);
    let currentY = f.y + yWobble;
    
    // 計算滑鼠與小魚的距離 (因畫布設定了 pointer-events: none，改用 winMouseX/winMouseY 追蹤視窗上的滑鼠)
    let d = dist(winMouseX, winMouseY, f.x, currentY);
    let actualSpeed = f.speed; // 預設使用基礎游動速度
    
    // 如果滑鼠靠近 (距離小於 150)，則觸發逃跑加速
    if (d < 150 && d > 0) {
      // 越靠近滑鼠，逃跑的額外速度越大 (將最大加速度稍微提升至 15)
      let escapeForce = map(d, 0, 150, 15, 0); 
      
      // 計算 X 與 Y 方向的向量，讓小魚產生更自然的 2D (上下左右) 躲避路徑
      let dx = f.x - winMouseX;
      let dy = currentY - winMouseY;
      
      actualSpeed += (dx / d) * escapeForce;            // X 軸方向加速逃離
      f.y += (dy / d) * escapeForce * 0.5;              // Y 軸方向同時稍微躲避
      f.y = constrain(f.y, height * 0.1, height * 0.9); // 限制小魚躲避時不要跑出畫面上下的合理範圍
    }
    
    // 更新 X 座標 (使用實際速度)
    f.x += actualSpeed;
    
    // 檢查是否游出螢幕，若游出則從另一邊重新出現並更換屬性
    if (actualSpeed > 0 && f.x > width + f.size * 2) {
      f.x = -f.size * 2;
      f.y = random(height * 0.1, height * 0.8);
      f.c = color(random(colors));
      f.speed = abs(f.speed); // 確保重生後基礎方向正確
    } else if (actualSpeed < 0 && f.x < -f.size * 2) {
      f.x = width + f.size * 2;
      f.y = random(height * 0.1, height * 0.8);
      f.c = color(random(colors));
      f.speed = -abs(f.speed); // 確保重生後基礎方向正確
    }
    
    fill(f.c);
    // 畫出魚的身體 (橢圓形)
    ellipse(f.x, currentY, f.size * 2, f.size);
    
    // 畫出魚的尾巴 (三角形) 與眼睛，根據「實際游動方向」決定位置
    if (actualSpeed > 0) {
      triangle(f.x - f.size, currentY, f.x - f.size * 1.5, currentY - f.size * 0.5, f.x - f.size * 1.5, currentY + f.size * 0.5);
      
      // 畫眼睛 (朝右)
      fill(255); // 眼白
      circle(f.x + f.size * 0.5, currentY - f.size * 0.15, f.size * 0.4);
      fill(0);   // 眼珠
      circle(f.x + f.size * 0.6, currentY - f.size * 0.15, f.size * 0.2);
    } else {
      triangle(f.x + f.size, currentY, f.x + f.size * 1.5, currentY - f.size * 0.5, f.x + f.size * 1.5, currentY + f.size * 0.5);
      
      // 畫眼睛 (朝左)
      fill(255); // 眼白
      circle(f.x - f.size * 0.5, currentY - f.size * 0.15, f.size * 0.4);
      fill(0);   // 眼珠
      circle(f.x - f.size * 0.6, currentY - f.size * 0.15, f.size * 0.2);
    }
  }

  // 繪製與更新氣泡 (放在水草前繪製，當作背景)
  for (let i = 0; i < bubbles.length; i++) {
    let b = bubbles[i];
    
    // 利用 noise 讓氣泡在上升時有左右漂浮的搖晃感
    let xWobble = map(noise(b.noiseOffset, frameCount * 0.01), 0, 1, -30, 30);
    let x = (b.xRatio * width) + xWobble;
    
    if (!b.isPopping) {
      // 更新 Y 座標 (讓氣泡往上飄)
      b.y -= b.speed;
      
      // 繪製水泡主體，顏色白色，透明度 0.5 (約 127/255)
      noStroke();
      fill(255, 255, 255, 127);
      circle(x, b.y, b.size);
      
      // 繪製水泡上面的白色圓圈亮點，透明度 0.7 (約 178/255)
      fill(255, 255, 255, 178);
      // 將亮點畫在偏左上方，並把尺寸縮小，製造水泡的反光感
      circle(x - b.size * 0.15, b.y - b.size * 0.15, b.size * 0.3);
      
      // 當水泡上升到設定的破裂高度時，觸發破裂狀態
      if (b.y < b.popY) {
        b.isPopping = true;
        b.popRadius = b.size; // 破裂動畫由當前大小開始
        b.popAlpha = 178;     // 破裂動畫的起始透明度
      }
    } else {
      // 破裂特效：畫一個逐漸擴大、淡出的空心圓圈
      noFill();
      stroke(255, 255, 255, b.popAlpha);
      strokeWeight(2);
      circle(x, b.y, b.popRadius);
      
      b.popRadius += 1.5; // 圓圈擴大
      b.popAlpha -= 8;    // 透明度淡出
      
      // 當破裂動畫結束後，讓水泡從畫面最底部重新產生
      if (b.popAlpha <= 0) {
        b.isPopping = false;
        b.y = height + b.size + random(50);
        b.xRatio = random(1);
        b.popY = random(height * 0.1, height * 0.8); // 重新分配下一次破裂的高度
      }
    }
  }
  
  // 設定水草的樣式
  noFill();
  strokeCap(ROUND);    // 讓線條兩邊的端點呈現圓滑狀
  strokeJoin(ROUND);   // 讓線條交接處呈現圓滑狀
  
  let segments = 60;              // 組成水草的節點數量
  
  // 迴圈產生 50 根小草
  for (let p = 0; p < 50; p++) {
    let g = grasses[p];
    stroke(g.c);
    strokeWeight(g.weight); // 套用個別水草的隨機粗細
    
    let startX = g.xRatio * width;            // 讓水草長在隨機的 X 座標上，允許重疊
    let plantHeight = height * g.heightRatio; // 套用個別水草的高度
    
    beginShape();
    for (let i = 0; i <= segments; i++) {
      // 利用 map 計算每個節點的 Y 座標：從底部(height)慢慢往上生長
      let y = map(i, 0, segments, height, height - plantHeight);
      
      // 使用 noise 產生平滑隨機值，並加上各水草專屬的偏移值與搖晃速度 (speed)
      let n = noise(i * 0.01 + g.noiseOffset, frameCount * g.speed); 
      
      // 利用 map 將 noise (0~1) 轉換為各自專屬搖晃幅度 (amp) 的偏移量
      let baseOffset = map(n, 0, 1, -g.amp, g.amp);
      
      // 設定搖晃幅度權重：越靠近根部搖晃越小，越頂端搖晃越大
      let swayFactor = map(i, 0, segments, 0, 1);
      let x = startX + (baseOffset * swayFactor);

      curveVertex(x, y);
      
      // curveVertex 需要重複第一個與最後一個控制點，確保曲線能完整連接到起點與終點
      if (i === 0 || i === segments) {
        curveVertex(x, y);
      }
    }
    endShape();
  }
}

// 當視窗大小改變時，自動調整畫布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
