const chalk = require('chalk');
const dbh = require('../dbh.js');

module.exports = {
    askForTableName,
    askForIdName,
    askForColumnsName,
    askForRelationshipsId
};

/**
 * Ask the table name for an entity
 */
function askForTableName() {
    if (this.force) {
        return;
    }

    const validateTableName = dbh.validateTableName;
    const done = this.async();

    this.prompt([
        {
            type: 'input',
            name: 'dbhTableName',
            validate: ((input) => {
                const prodDatabaseType = this.jhipsterAppConfig.prodDatabaseType;
                return validateTableName(input, prodDatabaseType);
            }),
            message: 'What is the table name for this entity ?',
            default: this.entityTableName
        }
    ]).then((props) => {
        this.tableNameInput = props.dbhTableName;
        done();
    });
}

function askForIdName() {
    if (this.force) {
        return;
    }

    const validateColumnName = dbh.validateColumnName;
    const done = this.async();

    this.prompt([
        {
            type: 'input',
            name: 'dbhIdName',
            validate: ((input) => {
                const prodDatabaseType = this.jhipsterAppConfig.prodDatabaseType;
                return validateColumnName(input, prodDatabaseType);
            }),
            message: 'What id name do you want for this entity ?',
            default: this.dbhIdName ? this.dbhIdName : 'id'
        }
    ]).then((props) => {
        this.idNameInput = props.dbhIdName;
        done();
    });
}

/** For each field of an entity, ask the actual column name */
function askForColumnsName() {
    // Don't ask columns name if there aren't any field
    // Or option --force
    if (this.fields === undefined || this.fields.length === 0 || this.force) {
        return;
    }

    this.log(chalk.green(`Asking column names for ${this.fields.length} field(s)`));
    const done = this.async();

    // work on a copy
    this.fieldsPile = this.fields.slice();
    // feed the first item for the first question
    this.field = this.fieldsPile.pop();
    askForColumnName.call(this, done);
}

/**
 * Use ${this.field} which is set either by askForColumnsName or previous recursive call
 *
 * Ask the column name for the field of an entity
 * This function use ${this.fieldsPile}, at each call it will pop an item from it and ask its question about it.
 * Then it will associate the answer with this item and push it to ${this.columnsInput}.
 * So at the end of the recursion, ${this.fieldsPile} will be empty and this.columnsInput full with what was in the former.
 */
function askForColumnName(done) {
    const validateColumnName = dbh.validateColumnName;
    const defaultAnswer = this.field.dbhColumnName || this.field.fieldNameAsDatabaseColumn || this.field.dbhColumnName;

    const prompts = [
        {
            type: 'input',
            name: 'dbhColumnName',
            validate: ((input) => {
                const prodDatabaseType = this.jhipsterAppConfig.prodDatabaseType;
                return validateColumnName(input, prodDatabaseType);
            }),
            message: `What column name do you want for the field "${this.field.fieldName}" ?`,
            default: defaultAnswer
        }
    ];

    this.prompt(prompts).then((props) => {
        this.field.columnNameInput = props.dbhColumnName;

        // push just processed item
        this.columnsInput.push(this.field);
        // pop item for next recursion
        this.field = this.fieldsPile.pop();

        if (this.field !== undefined) {
            askForColumnName.call(this, done);
        } else {
            done();
        }
    });
}

/** For each relationship of entity, ask for actual column name */
function askForRelationshipsId() {
    // Don't ask relationship id if there aren't any relationship
    // Or option --force
    if (this.relationships === undefined || this.relationships.length === 0 || this.force) {
        return;
    }

    // work only on owner relationship
    this.relationshipsPile = this.relationships.filter(relationshipItem =>
        // We don't need to do anything about relationships which don't add any constraint.
        !(relationshipItem.relationshipType === 'one-to-many' ||
            (relationshipItem.relationshipType === 'one-to-one' && !relationshipItem.ownerSide) ||
            (relationshipItem.relationshipType === 'many-to-many' && !relationshipItem.ownerSide)));

    if (this.relationshipsPile.length === 0) {
        return;
    }

    this.log(chalk.green(`Asking column names for ${this.relationshipsPile.length} relationship(s)`));
    const done = this.async();

    this.relationship = this.relationshipsPile.pop();
    askForRelationshipId.call(this, done);
}

/**
 * Use ${this.relationship} which is set either by askForRelationshipsId or previous recursive call
 *
 * Ask the column name for the relationship of an entity
 * This function use ${this.relationshipsPile}, at each call it will pop an item from it and ask its question about it.
 * Then it will associate the answer with this item and push it to ${this.relationshipsInput}.
 * So at the end of the recursion, ${this.relationshipsPile} will be empty and this.relationshipsInput full with what was in the former.
 */
function askForRelationshipId(done) {
    const validateColumnName = dbh.validateColumnName;
    const defaultAnswer = this.relationship.dbhRelationshipId || `${this.relationship.relationshipName}_id`;

    const prompts = [
        {
            type: 'input',
            name: 'dbhRelationshipId',
            validate: ((input) => {
                const prodDatabaseType = this.jhipsterAppConfig.prodDatabaseType;
                return validateColumnName(input, prodDatabaseType);
            }),
            message: `What column name do you want for the relationship "${this.relationship.relationshipName}" ?`,
            default: defaultAnswer
        }
    ];

    this.prompt(prompts).then((props) => {
        this.relationship.relationshipIdInput = props.dbhRelationshipId;

        // push just processed item
        this.relationshipsInput.push(this.relationship);
        // pop item for next recursion
        this.relationship = this.relationshipsPile.pop();

        if (this.relationship !== undefined) {
            askForRelationshipId.call(this, done);
        } else {
            done();
        }
    });
}
