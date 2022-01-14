import ctypes


test = 43536

print(test)
print(ctypes.c_short(test).value)