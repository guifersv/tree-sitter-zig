import io.github.treesitter.jtreesitter.Language;
import io.github.treesitter.jtreesitter.zig.TreeSitterZig;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;

public class TreeSitterZigTest {
    @Test
    public void testCanLoadLanguage() {
        assertDoesNotThrow(() -> new Language(TreeSitterZig.language()));
    }
}
