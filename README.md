# regexp-jexl-reader
Read data from the nmea0183 and nmea0183out stream and parse that using regular expressions and jexl

Example to parse the [PASHR Message](https://www.hemispheregnss.com/technical-resource-manual/Import_Folder/PASHR_Message.htm):
![screenshor](https://github.com/codekilo/regexp-jexl-reader/blob/master/screenshot.png?raw=true)

In this example the regular expression is `^\$PASHR,([^,]*),([^,]*),([^,]*),([^,]*),([^,]*)`. When an incomming line matches this regular expression all corresponding calculations are applied. A calculation consist of a Jexl expression and a SignalK path. In the Jexl expression the variable `m` can be used to retrieve the results of the regular expression match. `m[4]` is the value of the 4th group in the regular expression. The expression in this example are `{roll: m[4] * 0.01745329252, pitch: m[5] * 0.01745329252}` and `m[2] * 0.01745329252`
