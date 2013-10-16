/**
 * brightness monitor
 */
int count = 0;

void setup(){
  Serial.begin(9600);
  delay(1000);

}

void loop(){
  Serial.print(count);
  Serial.print("\n");

  count ++;
  if( count >= 256 ){ count = 0; }

  delay(100);
}
