/**
 * brightness monitor
 */
int potpin0 = 0;
int val0;
int val0last;

void setup(){
  Serial.begin(9600);
  delay(1000);

}

void loop(){

  val0 = analogRead(potpin0);//可変抵抗器からの入力
  val0 = map(val0, 0, 1023, 0, 255);//可変抵抗は0〜1023の範囲で値を返す。解像度を合わせる。

  if( val0last != val0 ){
    Serial.print(val0);
    Serial.print("\n");
    val0last = val0;
  }
  delay(100);
}
