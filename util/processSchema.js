// Load all properties from the schema.org.json file and create models for them
// Generated objects should take this form:
//   {
//     "label": "",
//     "comment": "",
//     "properties": [
//       "object"
//     ],
//     "parents": [
//       ""
//     ],
//     "vocab": "schema",
//     "id": 0
//   }

var fs = require('fs'),
    request = require('request'),
    cheerio = require('cheerio'),
    http = require('http'),
    mustache = require('mustache');

var schemaUrl = 'http://schema.org/docs/schema_org_rdfa.html';
var $;

var properties = {};
var things = [];

// Download the canonical RDFa for schema.org and parse it
// FIXME: Below file should refer to schemaUrl
fs.readFile('./schema.org.rdfa.html', 'utf8', function (error, text) {

  if (!error){
    $ = cheerio.load(text);

    // Process properties
    $('div[typeof="rdf:Property"]').each(function (i, elem) {
      var label = $(this).find('span[property="rdfs:label"]').text();
      var range = [];

      $(this).find('a[property="http://schema.org/rangeIncludes"]').each(function() {
        range.push($(this).text());
      });

      // Store the property for later use with the thing parser
      properties[label] = range;
    });

    // Process things
    var i = 0;
    $('div[typeof="rdfs:Class"]').each(function (i, elem) {
      var thing = {};
      thing.label = $(this).find('span[property="rdfs:label"]').text(),
      thing.vocab = 'schema';
      thing.comment = $(this).find('span[property="rdfs:comment"]').text();
      thing.properties = getPropertiesForThing(thing.label, $(this).html()) || [];
      thing.parents = getParentsForThing(thing.label, $(this).html()) || [];

      // Post to API
      var i = 0;
      setTimeout(function () {
        console.log('Posting ' + thing.label);
        request({
          uri: 'http://localhost:3000/api/vocabularies',
          method: "POST",
          form: thing
        });
        i++;
      }, i*500);
    });




    // Write to file
    // fs.writeFile('schema.org.js', JSON.stringify(things), function(err) {
    //   if(err) {
    //     console.log(err);
    //   } else {
    //     console.log('Created schema.org.js');
    //   }
    // });
  }
});


//
// Helper Functions
//


var getParentsForThing = function(label, thingHtml) {
  // If this thing inherits properties from other things, push their properties onto the stack (recursively)
  var parents = [];
  $(thingHtml).find('a[property="rdfs:subClassOf"]').each(function() {
    parents.push($(this).text());
  });
  return parents;
}

var getPropertiesForThing = function(label, thingHtml) {
  var thingProperties = [];

  // If has ancestors, get parent properties recursively and push onto properties stack
  // Get properties specific to this thing
  $('body').find('a[property="http://schema.org/domainIncludes"][href="http://schema.org/'+label+'"]').parent().parent().find('[property="rdfs:label"]').each(function() {
    var propertyName = $(this).text();
    var comment = $(this).next('[property="rdfs:comment"]').text();
    var property = {
      label: propertyName,
      comment: comment,
      type: properties[propertyName]
    }
    thingProperties.push(property);
  })

  return thingProperties;
}

var parseDataType = function(type) {
  switch (type) {
    case 'Boolean': return 'Boolean';
    case 'Date':
    case 'DateTime':
    case 'Time': return 'Date';
    case 'Number':
    case 'Float':
    case 'Integer': return 'Number';
    case 'URL':
    case 'Text': return 'String';
    default: return '{ type: Schema.Types.ObjectId, ref: "'+type+'" }';
  }
}

