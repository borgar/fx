/* eslint-disable no-undefined, no-console */

function formatType (d, inTable = false) {
  return d.names?.map(n => `\`${n}\``).join(inTable ? ' \\| ' : ' | ') || '';
}

function formatArguments (args, showDefaults = true) {
  let inOpt = false;
  let r = args.reduce((a, d, i) => {
    if (d.name.includes('.')) {
      return a;
    }
    if (inOpt && !d.optional) {
      a += ']_';
      inOpt = false;
    }
    if (i) {
      a += ', ';
    }
    if (!inOpt && d.optional) {
      a += '_[';
      inOpt = true;
    }
    a += d.name;
    if (showDefaults && d.defaultvalue) {
      a += ' = `' + d.defaultvalue + '`';
    }
    return a;
  }, '');
  if (inOpt) {
    r += ']_';
  }
  return r;
}

function repValue (v) {
  if (v === undefined) {
    return '';
  }
  if (v === "''") {
    // FIXME: should transform all '' strings to "" style
    v = '""';
  }
  return '`' + v + '`';
}

function repArgName (name, optional = false) {
  const names = name.split('.');
  const nPath = names.length > 1 ? '.' + names.slice(1).join('.') : '';
  return (optional ? '_[' : '') + names[0] + (optional ? ']_' : '') + nPath;
}

function listToTable (args) {
  const useDefaults = args.some(d => !!d.defaultvalue);
  const table = useDefaults
    ? [
      '| Name | Type | Default | Description |',
      '| ---- | ---- | ------- | ----------- |' ]
    : [
      '| Name | Type | Description |',
      '| ---- | ---- | ----------- |' ];
  args.forEach(d => {
    const row = [ repArgName(d.name, d.optional) ];
    row.push(formatType(d.type, true));
    useDefaults && row.push(repValue(d.defaultvalue));
    row.push(transformLinks(d.description));
    table.push('| ' + row.join(' | ') + ' |');
  });

  return table.join('\n');
}

function adjustLineBreaks (md) {
  return md.trim().replace(
    /(?:```([^\0]*?)```|(\S)\n(?!\n))/g,
    (a, b, c) => {
      return (c ? (c + ' ') : a);
    }
  );
}

function formatSee (see) {
  if (see) {
    if (/^[a-z][a-z0-9]*$/i.test(see)) {
      see = `{@link ${see}}`;
    }
    return `\n**See also:** ${transformLinks(see)}.\n`;
  }
  return '';
}

const re_links = /(?:\[([^\]]+)\])?\{@link(?:code|plain)? ([^} ]+)([^}]+)?\}/g;
function transformLinks (md) {
  return md.replace(re_links, (a, preLabel, href, postLabel) => {
    const hash = /^[a-z][a-z0-9]*$/i.test(href) ? '#' : '';
    return `[${preLabel || postLabel || href}](${hash}${href})`;
  });
}

function formatHeading (text, level = 2) {
  return '#'.repeat(level || 1) + ' ' + text;
}

function formatIndexLink (name, text) {
  return `[${text.replace(/([[\]])/g, '\\$1')}](#${name})`;
}

const formatIndex = {
  function: d => {
    return '- ' + formatIndexLink(d.name,
      `${d.name}( ${formatArguments(d.params, false)} )`
    );
  },
  constant: d => {
    return '- ' + formatIndexLink(d.name,
      `${d.name}`
    );
  }
}

const format = {
  function: d => {
    return [
      formatHeading(`<a name="${d.name}" href="#${d.name}">#</a> ${d.name}( ${formatArguments(d.params)} ) ⇒ ${formatType(d.returns[0].type)}`, 3),
      adjustLineBreaks(transformLinks(d.description)),
      formatSee(d.see),
      formatHeading('Parameters', 4),
      listToTable(d.params),
      formatHeading('Returns', 4),
      formatType(d.returns[0].type) + ' – ' + d.returns[0].description
    ];
  },
  constant: d => {
    return [
      formatHeading(`<a name="${d.name}" href="#${d.name}">#</a> ${d.name} ⇒ ${formatType(d.type)}`, 3),
      adjustLineBreaks(transformLinks(d.description)),
      formatSee(d.see),
      formatHeading('Properties', 4),
      listToTable(d.properties)
    ];
  }
};

const categoryHeadings = {
  package: null,
  function: 'Functions',
  constant: 'Constants'
};

exports.publish = (data, { destination }) => {
  data({ undocumented: true }).remove();
  const docs = data().get();

  const test = '';
  if (test) {
    const s = docs.find(d => d.name === test);
    const o = format[s.kind](s);
    console.log(o.join('\n\n'));
    return;
  }

  const categories = {};
  docs.forEach(d => {
    if (!categories[d.kind]) {
      categories[d.kind] = [];
    }
    categories[d.kind].push(d);
  });

  let output = [];
  const index = [];

  Object.keys(categories)
    .sort()
    .forEach(kind => {
      const heading = categoryHeadings[kind];
      if (heading == null) { return; }
      // emit category heading
      if (index.length) { index.push(''); }
      index.push('**' + heading + '**', '');
      output.push(formatHeading(heading, 2));
      // emit all members belonging to that category
      docs
        .filter(d => d.kind === kind)
        .filter(d => d.access !== 'private')
        .sort((a, b) => {
          if (a.name < b.name) { return -1; }
          if (a.name > b.name) { return 1; }
          return NaN;
        })
        .forEach((d, i) => {
          if (i) {
            output.push('---');
          }
          if (!format[d.kind]) {
            console.error('Unsupported member type ' + d.kind);
            process.exit(1);
          }
          index.push(formatIndex[d.kind](d));
          output.push(...format[d.kind](d));
        });
    });

  if (destination === 'console') {
    const outText = (
      index.map(d => d.trim()).join('\n') +
      '\n\n' +
      output.map(d => d.trim()).filter(Boolean).join('\n\n') +
      '\n'
    );
    console.log(outText);
  }
  else {
    console.error('This template only supports output to the console. Use the option "-d console" when you run JSDoc.');
    process.exit(1);
  }
};
