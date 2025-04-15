import pandas as pd
import re

df = pd.read_parquet("data_latest.parquet", engine="pyarrow")

print(df.columns)
