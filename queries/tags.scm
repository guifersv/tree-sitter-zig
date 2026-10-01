(container_field
 name: (identifier) @name) @definition.field

(function_declaration
 name: (identifier) @name) @definition.function
(extern_function_declaration
 name: (identifier) @name) @definition.function

(global_variable_declaration
 name: (identifier) @name
 value: (struct_type)) @definition.struct
(variable_assignment_statement
 name: (identifier) @name
 value: (struct_type)) @definition.struct
(global_variable_declaration
 name: (identifier) @name
 value: (packed_struct_type)) @definition.struct
(variable_assignment_statement
 name: (identifier) @name
 value: (packed_struct_type)) @definition.struct

(global_variable_declaration
 name: (identifier) @name
 value: (enum_type)) @definition.enum
(variable_assignment_statement
 name: (identifier) @name
 value: (enum_type)) @definition.enum

(global_variable_declaration
 name: (identifier) @name
 value: (union_type)) @definition.union
(variable_assignment_statement
 name: (identifier) @name
 value: (union_type)) @definition.union

(global_variable_declaration
 name: (identifier) @name
 value: (opaque_type)) @definition.type
(variable_assignment_statement
 name: (identifier) @name
 value: (opaque_type)) @definition.type

(global_variable_declaration
 name: (identifier) @name
 value: (error_set_declaration)) @definition.type
(variable_assignment_statement
 name: (identifier) @name
 value: (error_set_declaration)) @definition.type

(call_expression
 (identifier) @name) @reference.call

(call_expression
 (access_expression
  field: (identifier) @name)) @reference.call
