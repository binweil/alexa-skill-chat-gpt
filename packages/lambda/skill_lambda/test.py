from datetime import datetime
from datetime import timedelta

dt_time = datetime.now() + timedelta(days=30)
print(dt_time.strftime('%s'))
number = 10000 * dt_time.year + 100 * dt_time.month + dt_time.day
print(number)
