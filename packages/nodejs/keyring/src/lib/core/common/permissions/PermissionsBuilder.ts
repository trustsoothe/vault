import merge from 'lodash/merge';
import union from 'lodash/union';
import unionBy from 'lodash/unionBy';

export enum PermissionResources {
  account = 'account',
  transaction = 'transaction',
  session = 'session',
}

export type ResourceConfig = {
  [key in keyof typeof PermissionResources]: string[]
};

export type Permission = {
  resource: keyof typeof PermissionResources
  action: string
  identities: string[]
};

export type Resource = {
  name: keyof typeof PermissionResources
  permissions: Permission[]
}

class ResourcePermissionBuilder {
  private readonly builder: PermissionsBuilder;
  private readonly resource: Resource;
  constructor(resource: Resource, permissionsBuilder: PermissionsBuilder) {
    this.resource = resource;
    this.builder = permissionsBuilder;
  }

  allow(...actions: string[]) {
    this.addActionPermissions(actions);
    return this;
  }

  allowEverything() {
    this.addActionPermissions(this.builder.getResourceActions(this.resource.name));
    return this;
  }

  andBuild() {
    return this.builder.build();
  }

  on(...identities: string[]) {
    this.setPermissionsIdentities(identities);
    return this.builder;
  }

  onAny() {
    this.setPermissionsIdentities(['*']);
    return this.builder;
  }

  private setPermissionsIdentities(identities: any[]) {
    this.resource.permissions = this.resource.permissions.map(permission => {
      return {
        ...permission,
        identities: union(permission.identities, identities),
      };
    });
  }

  private addActionPermissions(actions: string[]) {
    const isAnyActionUnknown = actions.some(action => !this.builder.isValidAction(this.resource.name, action));

    if (isAnyActionUnknown) {
      const invalidActions = actions.filter(action => !this.builder.isValidAction(this.resource.name, action));
      throw new Error(`Unknown actions: ${invalidActions.join(', ')} for resource ${this.resource.name}`);
    }

    const proposedPermissions = actions.map(action => {
      return {
        resource: this.resource.name,
        action,
        identities: []
      };
    })

    const uniquePermissions = unionBy(this.resource.permissions, proposedPermissions, 'action');

    this.resource.permissions = uniquePermissions.map(permission => {
      const proposedPermission = proposedPermissions.find(proposedPermission => proposedPermission.action === permission.action);

      if (!proposedPermission) {
        return permission;
      }

      return merge(permission, proposedPermission);
    });
  }
}
export class PermissionsBuilder {
  private readonly resources: Resource[] = [];
  private readonly resourceConfig: ResourceConfig = {
    account: ['create', 'read', 'update', 'delete'],
    transaction: ['send'],
    session: ['list', 'revoke'],
  }
  constructor(permissions?: Permission[]) {
    if (permissions) {
      this.resources = permissions.reduce((resources: Resource[], permission) => {
        const resource = resources.find(resource => resource.name === permission.resource);

        if (resource) {
          resource.permissions.push(permission);
        } else {
          resources.push({
            name: permission.resource,
            permissions: [permission],
          });
        }

        return resources;
      }, []);
    }
  }

  forResource(resourceName: keyof typeof PermissionResources) {
    if (!this.resourceConfig.hasOwnProperty(resourceName)) {
      throw new Error(`Unknown resource: ${resourceName}`);
    }

    const preExistingResource = this.resources.find(resource => resource.name === resourceName);

    if (preExistingResource) {
      return new ResourcePermissionBuilder(preExistingResource, this);
    }

    const resource = {
      name: resourceName,
      permissions: []
    };

    this.resources.push(resource);

    return new ResourcePermissionBuilder(resource, this);
  }

  build () {
    return this.resources.reduce((permissions: Permission[], resource) =>
      permissions.concat(resource.permissions), []);
  }

  getResourceActions(resource: keyof typeof PermissionResources) {
    return this.resourceConfig[resource];
  }

  isValidAction(resource: keyof typeof PermissionResources, action: string) {
    const validActions = this.getResourceActions(resource)
    return validActions && validActions.includes(action);
  }
}
