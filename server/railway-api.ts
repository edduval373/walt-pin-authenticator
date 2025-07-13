import { log } from './vite-backup';
import fetch from 'node-fetch';

// Railway API access
const RAILWAY_TOKEN = process.env.RAILWAY_TOKEN;
const RAILWAY_API_URL = 'https://backboard.railway.app/graphql/v2';

/**
 * Utility functions for accessing Railway API
 */

// Check if Railway token is configured
export const isRailwayConfigured = (): boolean => {
  return !!RAILWAY_TOKEN;
};

// Get all projects from Railway
export async function listRailwayProjects() {
  try {
    if (!isRailwayConfigured()) {
      throw new Error('Railway token not configured');
    }

    const query = `
      query Projects {
        projects {
          edges {
            node {
              id
              name
              description
              services {
                edges {
                  node {
                    id
                    name
                    domains {
                      edges {
                        node {
                          id
                          domain
                          status
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`
      },
      body: JSON.stringify({ query })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Railway API Error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return data.data?.projects?.edges.map(edge => edge.node) || [];

  } catch (error: any) {
    log(`Railway API Error: ${error.message}`, 'express');
    throw error;
  }
}

// Get all services for a specific Railway project
export async function getProjectServices(projectId: string) {
  try {
    if (!isRailwayConfigured()) {
      throw new Error('Railway token not configured');
    }

    const query = `
      query Project($id: String!) {
        project(id: $id) {
          id
          name
          services {
            edges {
              node {
                id
                name
                domains {
                  edges {
                    node {
                      id
                      domain
                      status
                    }
                  }
                }
              }
            }
          }
        }
      }
    `;

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`
      },
      body: JSON.stringify({
        query,
        variables: { id: projectId }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Railway API Error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return (data as any).data?.project?.services?.edges.map((edge: any) => edge.node) || [];

  } catch (error: any) {
    log(`Railway API Error: ${error.message}`, 'express');
    throw error;
  }
}

// Get service domains
export async function getServiceDomains(serviceId: string) {
  try {
    if (!isRailwayConfigured()) {
      throw new Error('Railway token not configured');
    }

    const query = `
      query Service($id: String!) {
        service(id: $id) {
          id
          name
          domains {
            edges {
              node {
                id
                domain
                status
              }
            }
          }
        }
      }
    `;

    const response = await fetch(RAILWAY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RAILWAY_TOKEN}`
      },
      body: JSON.stringify({
        query,
        variables: { id: serviceId }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Railway API Error: ${response.status} ${error}`);
    }

    const data = await response.json();
    return (data as any).data?.service?.domains?.edges.map((edge: any) => edge.node) || [];

  } catch (error: any) {
    log(`Railway API Error: ${error.message}`, 'express');
    throw error;
  }
}

// Discover all Railway services and their domains
export async function discoverRailwayServices() {
  try {
    if (!isRailwayConfigured()) {
      return { 
        configured: false,
        message: 'Railway token not configured',
        projects: [] 
      };
    }

    const projects = await listRailwayProjects();
    
    // Map projects with their services and domains
    const projectsWithServices = await Promise.all(
      projects.map(async (project) => {
        const services = project.services?.edges?.map(edge => edge.node) || [];
        
        // Get domains for each service
        const servicesWithDomains = services.map(service => {
          const domains = service.domains?.edges?.map(edge => edge.node) || [];
          return {
            ...service,
            domains: domains.map(domain => ({
              domain: domain.domain,
              status: domain.status
            }))
          };
        });
        
        return {
          id: project.id,
          name: project.name,
          description: project.description,
          services: servicesWithDomains
        };
      })
    );
    
    return {
      configured: true,
      message: 'Successfully retrieved Railway services',
      projects: projectsWithServices
    };

  } catch (error: any) {
    log(`Railway Discovery Error: ${error.message}`, 'express');
    return {
      configured: true,
      message: `Error discovering Railway services: ${error.message}`,
      projects: []
    };
  }
}