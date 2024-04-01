n = 2 ** 71 - 1

i = 2

while True:
    if n % i == 0:
        print(i, n / i)
    i += 1
    