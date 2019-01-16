/* istanbul ignore file */
'use strict';

export interface UserModel {
  id: number;
  email: string;
  password: string;
  updatedAt: string;
  createdAt: string;
  deletedAt: string | null;
}

export default class User {
  static init(sequelize, Sequelize) {
    return sequelize.define('users', {
      id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true
      },
      email: {
        type: Sequelize.STRING(60),
        allowNull: false
      },
      password: {
        type: Sequelize.STRING(255),
        allowNull: false
      },
      updatedAt: {
        field: 'updated_at',
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      },
      deletedAt: {
        field: 'deleted_at',
        type: Sequelize.DATE,
        allowNull: true
      },
      createdAt: {
        field: 'created_at',
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW
      }
    }, {
      freezeTableName: true,
      timestamps: true,
      paranoid: true  // forces Sequelize to always query for "deleted_at IS NULL" unless specified otherwise
    });
  }
}
