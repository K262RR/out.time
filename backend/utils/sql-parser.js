const fs = require('fs');

/**
 * Парсер SQL файлов с поддержкой dollar-quoted строк и вложенных кавычек
 */
class SqlParser {
  constructor() {
    this.commands = [];
    this.currentCommand = '';
    this.inDollarQuote = false;
    this.dollarTag = '';
    this.inSingleQuote = false;
    this.inDoubleQuote = false;
  }

  /**
   * Парсит SQL файл и возвращает массив команд
   * @param {string} filePath - путь к SQL файлу
   * @returns {string[]} массив SQL команд
   */
  parseFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    return this.parseContent(content);
  }

  /**
   * Парсит строку с SQL командами
   * @param {string} content - строка с SQL командами
   * @returns {string[]} массив SQL команд
   */
  parseContent(content) {
    this.commands = [];
    this.currentCommand = '';
    this.inDollarQuote = false;
    this.dollarTag = '';
    this.inSingleQuote = false;
    this.inDoubleQuote = false;

    const lines = content.split('\n');
    
    for (const line of lines) {
      this.parseLine(line);
    }

    if (this.currentCommand.trim()) {
      this.commands.push(this.currentCommand.trim());
    }

    return this.commands;
  }

  /**
   * Парсит одну строку SQL
   * @param {string} line - строка для парсинга
   */
  parseLine(line) {
    const trimmedLine = line.trim();
    
    // Пропускаем пустые строки и комментарии, если мы не внутри кавычек
    if (!this.inDollarQuote && !this.inSingleQuote && !this.inDoubleQuote) {
      if (!trimmedLine || trimmedLine.startsWith('--')) {
        return;
      }
    }

    let i = 0;
    while (i < line.length) {
      const char = line[i];
      const nextChar = line[i + 1] || '';

      if (this.inDollarQuote) {
        if (char === '$' && this.checkDollarTagEnd(line.slice(i))) {
          this.inDollarQuote = false;
          i += this.dollarTag.length;
        }
      } else if (this.inSingleQuote) {
        if (char === "'" && nextChar !== "'") {
          this.inSingleQuote = false;
        } else if (char === "'" && nextChar === "'") {
          i++; // Пропускаем следующую кавычку
        }
      } else if (this.inDoubleQuote) {
        if (char === '"') {
          this.inDoubleQuote = false;
        }
      } else {
        if (char === '$' && this.checkDollarTagStart(line.slice(i))) {
          this.inDollarQuote = true;
          this.dollarTag = this.extractDollarTag(line.slice(i));
          i += this.dollarTag.length - 1;
        } else if (char === "'") {
          this.inSingleQuote = true;
        } else if (char === '"') {
          this.inDoubleQuote = true;
        } else if (char === ';' && !this.isInQuotes()) {
          this.commands.push(this.currentCommand.trim());
          this.currentCommand = '';
          i++;
          continue;
        }
      }

      this.currentCommand += char;
      i++;
    }

    this.currentCommand += '\n';
  }

  /**
   * Проверяет, находимся ли мы внутри кавычек
   * @returns {boolean}
   */
  isInQuotes() {
    return this.inDollarQuote || this.inSingleQuote || this.inDoubleQuote;
  }

  /**
   * Проверяет начало dollar-quoted строки
   * @param {string} text - текст для проверки
   * @returns {boolean}
   */
  checkDollarTagStart(text) {
    const match = text.match(/^\$[A-Za-z0-9_]*\$/);
    return match !== null;
  }

  /**
   * Проверяет конец dollar-quoted строки
   * @param {string} text - текст для проверки
   * @returns {boolean}
   */
  checkDollarTagEnd(text) {
    return text.startsWith(this.dollarTag);
  }

  /**
   * Извлекает dollar-tag из текста
   * @param {string} text - текст для извлечения тега
   * @returns {string}
   */
  extractDollarTag(text) {
    const match = text.match(/^\$[A-Za-z0-9_]*\$/);
    return match ? match[0] : '$';
  }
}

module.exports = SqlParser; 