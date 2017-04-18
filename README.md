# lala
A simple language lexical analyzer, parser and interpreter, mostly intended to be used for small embedded applications, such as adding simple scripting.

The language is currently very simple, it only handles numeric and string variable declaration, IF/ELSE statements and a couple built-in functions.

Example:

<pre>
<code>
a = 1;
b = 3;
c = 4;
tony = "pizza";
if ((a * 4) + 1 == b || c > 2) {
  object.visible = false
} else {
  object.visible = true
}
</code>
</pre>
