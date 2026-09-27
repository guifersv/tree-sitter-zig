
; Comments

[
 (container_doc_comment)
 (doc_comment)
 ] @comment.documentation

(line_comment) @comment

; Literals

[
 (char_literal)
 (string_literal)
 (multiline_string_literal)
 ] @string

(integer_literal) @number
(float_literal) @number.float

(escape_sequence) @escape

; Identifiers

(primitive_type) @type.builtin
(anyframe_type) @type.builtin

; Definitions

[
 "("
 ")"
 "["
 "]"
 "{"
 "}" 
 ] @punctuation.bracket

[
 ":"
 "." 
 "," 
 ";"
 ] @punctuation.delimiter

[
 "addrspace"
 "align"
 "allowzero"
 "and"
 "anytype"
 "asm"
 "break"
 "callconv"
 "catch"
 "comptime"
 "const"
 "continue"
 "defer"
 "else"
 "enum"
 "errdefer"
 "error"
 "export"
 "extern"
 "fn"
 "for"
 "if"
 "inline"
 "noalias"
 "nosuspend"
 "noinline"
 "opaque"
 "or"
 "orelse"
 "packed"
 "pub"
 "return"
 "linksection"
 "struct"
 "suspend"
 "switch"
 "test"
 "threadlocal"
 "try"
 "union"
 "var"
 "volatile"
 "while"
 ] @keyword

[
 "*="
 "*|="
 "/="
 "%="
 "+="
 "+|="
 "-="
 "-|="
 "<<="
 "<<|="
 ">>="
 "&="
 "^="
 "|="
 "*%="
 "+%="

 "*"
 "/"
 "%"
 "*%"
 "*|"
 "||"
 "**"

 "+"
 "-"
 "++"
 "+%"
 "-%"
 "+|"
 "-|"

 "<<"
 ">>"
 "<<|"

 "&"
 "^"
 "|"

 "=="
 "!="
 "<"
 ">"
 "<="
 ">="

 "orelse"
 "catch"
 ] @operator

(parameter
 name: (identifier) @variable.parameter)

(payload
 (identifier) @variable.parameter)

(ptr_payload
 (identifier) @variable.parameter)

(ptr_list_payload
 (identifier) @variable.parameter)

(ptr_index_payload
 (identifier) @variable.parameter)

; Identifiers

(container_field
 name: (identifier) @variable.member)

(test_declaration
 doctest_name: (string_literal) @string.special)

(extern_variable_declaration
 layout: (string_literal) @string.special)

(extern_function_declaration
 layout: (string_literal) @string.special)

(block_label
 (identifier) @label)

(break_label
 (identifier) @label)

(list_item
 field: (identifier) @variable.member)

(inferred_superset
 (identifier) @variable.member)

(access_expression
 field: (identifier) @variable.member)

(error_subset
 (identifier) @constant)

; Function

(builtin_function
 (builtin_identifier) @function.builtin)

(call_expression
 (identifier) @function)

(call_expression
 (access_expression
  field: (identifier) @function))

(function_type
 name: (identifier) @function)

(function_declaration
 name: (identifier) @function)

(extern_function_declaration
 name: (identifier) @function)

; Assume TitleCaseTypeName
((identifier) @constant
 (#match? @constant "^[A-Z]"))
