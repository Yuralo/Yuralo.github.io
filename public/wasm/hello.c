#include <stdio.h>

int main() {
  printf("Hello from WebAssembly!\n");
  printf("This C code is running in your browser!\n");

  int numbers[5] = {1, 2, 3, 4, 5};
  int sum = 0;

  for (int i = 0; i < 5; i++) {
    sum += numbers[i];
  }

  printf("Sum of [1,2,3,4,5] = %d\n", sum);

  return 0;
}
