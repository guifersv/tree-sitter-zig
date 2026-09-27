/**
 * @file Zig grammar for tree-sitter
 * @author Guilherme Fernandes <gui.fer.sv@gmail.com>
 * @license GPL-3.0-only
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

const PREC = {
    call: 15,
    err_union: 14,
    init: 13,
    unary: 12,
    multiplicative: 11,
    additive: 10,
    shift: 9,
    bitwise: 8,
    comparison: 7,
    and: 6,
    or: 5,
    assignment: 4,
};

const assign_operators = [
    "*=",
    "*|=",
    "/=",
    "%=",
    "+=",
    "+|=",
    "-=",
    "-|=",
    "<<=",
    "<<|=",
    ">>=",
    "&=",
    "^=",
    "|=",
    "*%=",
    "+%=",
    "-%=",
];

const multiplicative_operators = ["*", "/", "%", "*%", "*|", "||", "**"];
const additive_operators = ["+", "-", "++", "+%", "-%", "+|", "-|"];
const shift_operators = ["<<", ">>", "<<|"];
const bitwise_operators = ["&", "^", "|"];
const comparison_operators = ["==", "!=", "<", ">", "<=", ">="];

export default grammar({
    name: "zig",

    extras: ($) => [/\s/, $.line_comment],

    inline: ($) => [$._identifier],

    word: ($) => $.identifier,

    conflicts: ($) => [
        [$.variable_assignment_statement, $._assign_expr],
        [$.expression, $.if_type_expression],
        [$._for_prefix],
        [$._while_prefix],
        [$.type, $.block_label],
    ],

    supertypes: ($) => [
        $.literal,
        $.statement,
        $.type,
        $.expression,
        $.container_declaration,
    ],

    reserved: {
        // https://ziglang.org/documentation/master/#Keyword-Reference
        global: ($) => [
            // Keywords must always be quoted regardless of context
            "addrspace",
            "align",
            "allowzero",
            "and",
            "anytype",
            "asm",
            "break",
            "callconv",
            "catch",
            "comptime",
            "const",
            "continue",
            "defer",
            "else",
            "enum",
            "errdefer",
            "error",
            "export",
            "extern",
            "fn",
            "for",
            "if",
            "inline",
            "noalias",
            "nosuspend",
            "noinline",
            "opaque",
            "or",
            "orelse",
            "packed",
            "pub",
            "resume",
            "return",
            "linksection",
            "struct",
            "suspend",
            "switch",
            "test",
            "threadlocal",
            "try",
            "union",
            "unreachable",
            "var",
            "volatile",
            "anyframe",
            "while",

            // Primitives only need to be quoted in a decl context
            // "true",
            // "false",
            // "null",
            // "undefined",
            // $.primitive_type
        ],
    },

    rules: {
        source_file: ($) =>
            seq(
                optional($.container_doc_comment),
                optional($._container_members),
            ),

        _container_members: ($) =>
            seq(
                choice(
                    seq(
                        repeat1($._container_member),
                        optional($.container_field),
                    ),
                    $.container_field,
                ),
            ),

        _container_member: ($) =>
            choice($.container_declaration, seq($.container_field, ",")),

        container_declaration: ($) =>
            choice(
                $.test_declaration,
                $.comptime_declaration,
                $.global_variable_declaration,
                $.extern_variable_declaration,
                $.function_declaration,
                $.extern_function_declaration,
            ),

        container_field: ($) =>
            prec(
                PREC.assignment,
                seq(
                    optional($.doc_comment),
                    optional("comptime"),
                    optional($._name),
                    field("type", $.type),
                    optional($.byte_align),
                    optional(seq("=", field("value", $.expression))),
                ),
            ),

        _name: ($) => prec(1, seq(field("name", $._identifier), ":")),

        comptime_declaration: ($) => seq("comptime", field("body", $.block)),

        test_declaration: ($) =>
            seq(
                "test",
                optional(
                    field(
                        "doctest_name",
                        choice($.string_literal, $.identifier),
                    ),
                ),
                field("body", $.block),
            ),

        // Declarations

        global_variable_declaration: ($) =>
            seq(
                optional($.doc_comment),
                optional("pub"),
                optional("export"),
                optional("threadlocal"),
                $._variable_declaration_proto,
                "=",
                field("value", $.expression),
                ";",
            ),

        extern_variable_declaration: ($) =>
            seq(
                optional($.doc_comment),
                optional("pub"),
                "extern",
                optional("threadlocal"),
                optional(field("layout", $.string_literal)),
                $._variable_declaration_proto,
                ";",
            ),

        extern_function_declaration: ($) =>
            seq(
                optional($.doc_comment),
                optional("pub"),
                "extern",
                optional(field("layout", $.string_literal)),
                $._function_proto,
                ";",
            ),

        function_declaration: ($) =>
            seq(
                optional($.doc_comment),
                optional("pub"),
                optional(choice("inline", "noinline", "export")),
                $._function_proto,
                $.block,
            ),

        // Expressions

        expression: ($) =>
            choice(
                $.type,

                $.init_list_expression,

                $.asm_expression,
                $.break_expression,
                $.continue_expression,
                $.comptime_expression,
                $.return_expression,
                $.try_expression,
                $.unary_expression,
                $.binary_expression,
                $.catch_expression,
                $.nosuspend_expression,
                $.resume_expression,

                $.for_expression,
                $.while_expression,
                $.if_expression,

                $.block,
            ),

        nosuspend_expression: ($) => seq("nosuspend", $.expression),
        resume_expression: ($) => seq("resume", $.expression),

        catch_expression: ($) =>
            prec.right(
                PREC.bitwise,
                seq($.expression, "catch", optional($.payload), $.expression),
            ),

        init_list_expression: ($) =>
            prec(PREC.init, seq($.expression, $.init_list)),

        asm_expression: ($) =>
            seq(
                "asm",
                optional("volatile"),
                "(",
                $.expression,
                optional($.asm_output),
                ")",
            ),

        asm_output: ($) =>
            seq(
                ":",
                optional(sepByCommaTrailing($.asm_output_item)),
                optional($.asm_input),
            ),

        asm_output_item: ($) =>
            seq(
                "[",
                $._identifier,
                "]",
                $.string_literal,
                "(",
                choice(seq("->", $.type), $._identifier),
                ")",
            ),

        asm_input: ($) =>
            seq(
                ":",
                optional(sepByCommaTrailing($.asm_input_item)),
                optional($.asm_clobbers),
            ),

        asm_input_item: ($) =>
            seq(
                "[",
                $._identifier,
                "]",
                $.string_literal,
                "(",
                $.expression,
                ")",
            ),

        asm_clobbers: ($) => seq(":", $.expression),

        break_expression: ($) =>
            prec.right(
                seq("break", optional($.break_label), optional($.expression)),
            ),
        continue_expression: ($) =>
            prec.right(
                seq(
                    "continue",
                    optional($.break_label),
                    optional($.expression),
                ),
            ),

        comptime_expression: ($) => seq("comptime", $.expression),

        if_expression: ($) =>
            prec.right(
                seq(
                    $._if_prefix,
                    field("consequence", $.expression),
                    field(
                        "alternative",
                        optional(
                            seq("else", optional($.payload), $.expression),
                        ),
                    ),
                ),
            ),

        for_expression: ($) =>
            prec.right(
                seq(
                    $._for_prefix,
                    field("value", $.expression),
                    field("alternative", optional(seq("else", $.expression))),
                ),
            ),

        while_expression: ($) =>
            prec.right(
                seq(
                    $._while_prefix,
                    field("value", $.expression),
                    field(
                        "alternative",
                        optional(
                            seq("else", optional($.payload), $.expression),
                        ),
                    ),
                ),
            ),

        return_expression: ($) =>
            prec.right(seq("return", optional($.expression))),

        try_expression: ($) => seq("try", $.expression),

        unary_expression: ($) =>
            prec(
                PREC.unary,
                seq(choice("!", "-", "-%", "~", "&"), $.expression),
            ),

        binary_expression: ($) => {
            const table = [
                [PREC.multiplicative, choice(...multiplicative_operators)],
                [PREC.additive, choice(...additive_operators)],
                [PREC.shift, choice(...shift_operators)],
                [PREC.bitwise, choice(...bitwise_operators, "orelse")],
                [PREC.comparison, choice(...comparison_operators)],
                [PREC.and, "and"],
                [PREC.or, "or"],
            ];
            return choice(
                ...table.map(([precedence, operator]) =>
                    prec.left(
                        precedence,
                        seq(
                            field("left", $.expression),
                            field("operator", operator),
                            field("right", $.expression),
                        ),
                    ),
                ),
            );
        },

        switch_expression: ($) =>
            seq(
                optional($.block_label),
                "switch",
                "(",
                field("value", $.expression),
                ")",
                "{",
                optional(sepByCommaTrailing($.switch_case)),
                "}",
            ),
        switch_case: ($) =>
            seq(
                optional("inline"),
                field("pattern", $._switch_item),
                "=>",
                optional($.ptr_index_payload),
                field(
                    "value",
                    choice($.expression, $._single_assignment_expression),
                ),
            ),

        _single_assignment_expression: ($) =>
            seq(
                field("left", $.expression),
                field("operator", choice(...assign_operators, "=")),
                field("right", $.expression),
            ),

        _switch_item: ($) =>
            choice(
                seq(
                    sepByCommaTrailing(
                        seq($.expression, optional(seq("...", $.expression))),
                    ),
                ),
                "else",
            ),

        init_list: ($) => seq("{", optional($._list_item), "}"),

        _list_item: ($) =>
            choice(
                sepByCommaTrailing($.list_item),
                sepByCommaTrailing($.expression),
            ),

        list_item: ($) =>
            seq(".", field("field", $._identifier), "=", $.expression),

        // Types

        type: ($) =>
            choice(
                $.primitive_type,
                $.identifier,
                $.builtin_function,
                $.literal,

                $.optional_type,
                $.many_pointer_type,
                $.pointer_type,
                $.slice_type,
                $.array_type,

                $.index_expression,
                $.access_expression,
                $.unwrap_expression,
                $.call_expression,

                $.opaque_type,
                $.enum_type,
                $.struct_type,
                $.packed_struct_type,
                $.union_type,

                alias($._function_proto, $.function_type),
                $.error_set_declaration,
                $.grouped_expression,

                $.block_type_expression,
                // $.for_type_expression,
                // $.while_type_expression,

                $.switch_expression,
                $.if_type_expression,

                $.error_subset,
                $.error_union,

                $.inferred_superset,
                $.inferred_init_list,

                alias("anyframe", $.anyframe_type),
                $.anyframe_type,
            ),

        inferred_superset: ($) => seq(".", $._identifier),

        inferred_init_list: ($) => seq(".", $.init_list),

        block_type_expression: ($) => seq($.block_label, $.block),

        grouped_expression: ($) => seq("(", $.expression, ")"),

        if_type_expression: ($) =>
            prec.right(
                seq(
                    $._if_prefix,
                    field("value", $.type),
                    field(
                        "alternative",
                        optional(seq("else", optional($.payload), $.type)),
                    ),
                ),
            ),

        union_type: ($) =>
            seq(
                optional(choice("extern", "packed")),
                "union",
                field("tag", optional($._union_tagged)),
                $._container_type_members,
            ),

        _union_tagged: ($) =>
            seq(
                "(",
                choice(
                    $.expression,
                    seq("enum", optional(seq("(", $.expression, ")"))),
                ),
                ")",
            ),

        packed_struct_type: ($) =>
            seq(
                "packed",
                "struct",
                optional(seq("(", $.expression, ")")),
                $._container_type_members,
            ),

        struct_type: ($) =>
            seq(optional("extern"), "struct", $._container_type_members),

        opaque_type: ($) => seq("opaque", $._container_type_members),

        enum_type: ($) =>
            seq(
                "enum",
                optional(seq("(", $.expression, ")")),
                $._container_type_members,
            ),

        _container_type_members: ($) =>
            seq(
                "{",
                optional($.container_doc_comment),
                optional($._container_members),
                "}",
            ),

        builtin_function: ($) =>
            seq($.builtin_identifier, $._call_function_suffix),

        unwrap_expression: ($) =>
            prec(PREC.call, seq($.type, choice(".*", seq(".", "?")))),
        access_expression: ($) =>
            prec(PREC.call, seq($.type, ".", field("field", $._identifier))),
        call_expression: ($) =>
            prec(PREC.call, seq($.type, $._call_function_suffix)),
        index_expression: ($) =>
            prec(PREC.call, seq($.type, "[", $.index_range, "]")),

        index_range: ($) =>
            seq(
                $.expression,
                optional(
                    seq(
                        "..",
                        seq(
                            optional($.expression),
                            optional(seq(":", $.expression)),
                        ),
                    ),
                ),
            ),

        error_subset: ($) => seq("error", ".", $._identifier),
        error_union: ($) =>
            prec.right(PREC.err_union, seq($.type, "!", $.type)),
        error_set_declaration: ($) =>
            seq(
                "error",
                "{",
                optional(
                    sepByCommaTrailing(
                        seq(optional($.doc_comment), $._identifier),
                    ),
                ),
                "}",
            ),

        anyframe_type: ($) => seq("anyframe", "->", $.type),

        optional_type: ($) => seq("?", $.type),

        array_type: ($) =>
            seq("[", $.expression, optional($._array_sentinel), "]", $.type),

        _array_sentinel: ($) => seq(":", $.expression),

        ptr_mods: ($) =>
            repeat1(
                choice(
                    $.byte_align,
                    $.addr_space,
                    "const",
                    "volatile",
                    "allowzero",
                ),
            ),

        slice_type: ($) =>
            seq(
                "[",
                optional(seq(":", $.expression)),
                "]",
                optional($.ptr_mods),
                $.type,
            ),

        many_pointer_type: ($) =>
            seq(
                "[",
                "*",
                optional(choice("c", seq(":", $.expression))),
                "]",
                optional($.ptr_mods),
                $.type,
            ),

        pointer_type: ($) => seq("*", optional($.single_ptr_mods), $.type),

        single_ptr_mods: ($) =>
            repeat1(
                choice(
                    $.bit_align,
                    $.addr_space,
                    "const",
                    "volatile",
                    "allowzero",
                ),
            ),

        // Statements

        block: ($) =>
            seq(
                "{",
                repeat(
                    choice(
                        $.variable_assignment_statement,
                        $.defer_statement,
                        $.errdefer_statement,
                        $.statement,
                    ),
                ),
                "}",
            ),

        variable_assignment_statement: ($) =>
            prec(
                PREC.assignment,
                seq(
                    optional("comptime"),
                    sepByComma(
                        choice($.expression, $._variable_declaration_proto),
                    ),
                    "=",
                    field("value", $.expression),
                    ";",
                ),
            ),

        _block_expression_statement: ($) =>
            prec(
                1,
                choice(
                    seq(optional($.block_label), $.block),
                    seq($._assign_expression, ";"),
                ),
            ),

        defer_statement: ($) => seq("defer", $._block_expression_statement),
        errdefer_statement: ($) =>
            seq("errdefer", optional($.payload), $._block_expression_statement),

        block_expression: ($) => prec(1, seq(optional($.block_label), $.block)),

        statement: ($) =>
            choice(
                $.block_expression,
                prec(1, $.switch_expression),
                $.if_statement,
                $.for_statement,
                $.while_statement,

                $.nosuspend_statement,
                $.suspend_statement,
                $.comptime_statement,

                // !StatementPrefix KEYWORD_comptime? AssignExpr SEMICOLON
                $.expression_statement,
                alias($._assignment_statement, $.variable_assignment_statement),
            ),

        nosuspend_statement: ($) =>
            seq("nosuspend", $._block_expression_statement),
        suspend_statement: ($) => seq("suspend", $._block_expression_statement),
        comptime_statement: ($) => seq("comptime", $.block_expression),

        if_statement: ($) =>
            seq(
                $._if_prefix,
                choice(
                    seq(
                        field("consequence", $.block_expression),
                        optional(
                            field(
                                "alternative",
                                seq("else", optional($.payload), $.statement),
                            ),
                        ),
                    ),
                    seq(
                        field("consequence", $._assign_expression),
                        choice(
                            ";",
                            field(
                                "alternative",
                                seq("else", optional($.payload), $.statement),
                            ),
                        ),
                    ),
                ),
            ),

        for_statement: ($) =>
            seq(
                $._for_prefix,
                choice(
                    seq(
                        field("value", $.block_expression),
                        field(
                            "alternative",
                            optional(seq("else", $.statement)),
                        ),
                    ),
                    seq(
                        field("value", $._assign_expression),
                        choice(
                            ";",
                            field("alternative", seq("else", $.statement)),
                        ),
                    ),
                ),
            ),

        while_statement: ($) =>
            seq(
                $._while_prefix,
                choice(
                    seq(
                        field("value", $.block_expression),
                        field(
                            "alternative",
                            optional(
                                seq("else", optional($.payload), $.statement),
                            ),
                        ),
                    ),
                    seq(
                        $._assign_expression,
                        choice(
                            ";",
                            field(
                                "alternative",
                                seq("else", optional($.payload), $.statement),
                            ),
                        ),
                    ),
                ),
            ),

        expression_statement: ($) => seq($.expression, ";"),

        _assign_expression: ($) =>
            prec(1, choice($._assign_expr, $.expression)),
        _assignment_statement: ($) => seq($._assign_expr, ";"),
        _assign_expr: ($) =>
            prec(
                PREC.assignment,
                seq(
                    optional("comptime"),
                    choice(
                        seq(
                            field("left", $.expression),
                            field("operator", choice(...assign_operators)),
                            field("right", $.expression),
                        ),
                        seq(
                            field("left", sepByComma($.expression)),
                            "=",
                            field("right", $.expression),
                        ),
                    ),
                ),
            ),

        // Definitions

        // https://ziglang.org/documentation/master/#Primitive-Types
        primitive_type: ($) =>
            token(
                prec(
                    1,
                    choice(
                        "isize",
                        "usize",
                        "c_char",
                        "c_short",
                        "c_ushort",
                        "c_int",
                        "c_uint",
                        "c_long",
                        "c_ulong",
                        "c_longlong",
                        "c_ulonglong",
                        "c_longdouble",
                        "f16",
                        "f32",
                        "f64",
                        "f80",
                        "f128",
                        "bool",
                        "anyopaque",
                        "void",
                        "noreturn",
                        "type",
                        "anyerror",
                        "comptime_int",
                        "comptime_float",
                        /[iu][0-9]+/,
                    ),
                ),
            ),

        literal: ($) =>
            choice(
                $.char_literal,
                $.integer_literal,
                $.float_literal,
                $.string_literal,
                $.multiline_string_literal,
                $.unreachable_literal,
            ),

        multiline_string_literal: ($) => repeat1(seq("\\\\", /.*/)),

        unreachable_literal: ($) => "unreachable",

        integer_literal: ($) =>
            token(
                seq(
                    /[0-9]/,
                    repeat(choice(/[_0-9A-DF-OQ-Za-df-oq-z]/, /[eEpP][+-]?/)),
                ),
            ),

        float_literal: ($) =>
            token(
                seq(
                    /[0-9]/,
                    repeat(choice(/[_0-9A-DF-OQ-Za-df-oq-z]/, /[eEpP][+-]?/)),
                    ".",
                    repeat1(choice(/[_0-9A-DF-OQ-Za-df-oq-z]/, /[eEpP][+-]?/)),
                ),
            ),

        char_literal: ($) => seq("'", choice($.escape_sequence, /[^'\\]/), "'"),

        string_literal: ($) =>
            seq(
                '"',
                repeat(
                    choice(
                        alias(
                            token.immediate(prec(1, /[^"\n\\]+/)),
                            $.string_literal_content,
                        ),
                        $.escape_sequence,
                    ),
                ),
                token.immediate('"'),
            ),

        identifier: ($) =>
            token(choice(/@"([^"\\]|\\.)*"/, /[A-Za-z_][A-Za-z0-9_]*/)),
        _identifier: ($) =>
            choice($.identifier, alias($.primitive_type, $.identifier)),
        builtin_identifier: ($) => /@[A-Za-z_][A-Za-z0-9_]*/,

        escape_sequence: ($) =>
            token.immediate(
                seq(
                    "\\",
                    choice(/[nrt\\'"]/, /x[0-9a-fA-F]{2}/, /u\{[0-9a-fA-F]+\}/),
                ),
            ),

        doc_comment: ($) => repeat1(token(seq("///", /.*/))),
        container_doc_comment: ($) => repeat1(token(seq("//!", /.*/))),
        line_comment: ($) => token(seq("//", /.*/)),

        // Helper

        block_label: ($) => seq($._identifier, ":"),
        break_label: ($) => seq(":", $._identifier),

        _if_prefix: ($) =>
            seq(
                "if",
                "(",
                field("condition", $.expression),
                ")",
                optional($.ptr_payload),
            ),

        _for_prefix: ($) =>
            seq(
                optional($.block_label),
                optional("inline"),
                "for",
                "(",
                field("pattern", sepByCommaTrailing($.for_item)),
                ")",
                $.ptr_list_payload,
            ),

        for_item: ($) =>
            seq($.expression, optional(seq("..", optional($.expression)))),

        _while_prefix: ($) =>
            seq(
                optional($.block_label),
                optional("inline"),
                "while",
                "(",
                field("condition", $.expression),
                ")",
                optional($.ptr_payload),
                field(
                    "continue_expression",
                    optional(seq(":", "(", $._assign_expression, ")")),
                ),
            ),

        _call_function_suffix: ($) =>
            seq("(", optional(sepByCommaTrailing($.expression)), ")"),

        _variable_declaration_proto: ($) =>
            seq(
                choice("const", "var"),
                field("name", $.identifier),
                optional(seq(":", field("type", $.type))),
                optional($.byte_align),
                optional($.addr_space),
                optional($.link_section),
            ),

        _function_proto: ($) =>
            seq(
                "fn",
                optional(field("name", $.identifier)),
                field("parameters", $.parameters),
                $._function_return,
            ),

        _function_return: ($) =>
            seq(
                optional($.byte_align),
                optional($.addr_space),
                optional($.link_section),
                optional($.callconv),
                field("return_type", seq(optional("!"), $.type)),
            ),

        parameter: ($) =>
            seq(
                optional($.doc_comment),
                optional(choice("noalias", "comptime")),
                optional($._name),
                field("type", choice("anytype", $.type)),
            ),
        parameters: ($) =>
            seq(
                "(",
                optional(
                    seq(
                        choice(
                            "...",
                            seq(
                                sepByComma($.parameter),
                                optional(seq(",", "...")),
                            ),
                        ),
                        optional(","),
                    ),
                ),
                ")",
            ),

        byte_align: ($) => seq("align", "(", $.expression, ")"),
        bit_align: ($) =>
            seq(
                "align",
                "(",
                $.expression,
                optional(seq(":", $.expression, ":", $.expression)),
                ")",
            ),
        addr_space: ($) => seq("addrspace", "(", $.expression, ")"),
        link_section: ($) => seq("linksection", "(", $.expression, ")"),
        callconv: ($) => seq("callconv", "(", $.expression, ")"),

        payload: ($) => seq("|", $.identifier, "|"),
        ptr_payload: ($) => seq("|", optional("*"), $.identifier, "|"),
        ptr_list_payload: ($) =>
            seq("|", sepByCommaTrailing(seq(optional("*"), $.identifier)), "|"),
        ptr_index_payload: ($) =>
            seq("|", optional("*"), sepByComma($.identifier), "|"),
    },
});

function sepByCommaTrailing(rule) {
    return seq(rule, repeat(seq(",", rule)), optional(","));
}

function sepByComma(rule) {
    return seq(rule, repeat(seq(",", rule)));
}
