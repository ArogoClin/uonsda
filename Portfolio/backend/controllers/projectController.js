import prisma from '../config/database.js';

// Public: Get all projects
export const getAllProjects = async (req, res) => {
  try {
    const { category, featured, search } = req.query;

    const where = {};
    if (category) where.category = category;
    if (featured) where.featured = featured === 'true';
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    const projects = await prisma.project.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Public: Get single project
export const getProjectById = async (req, res) => {
  try {
    const project = await prisma.project.findUnique({
      where: { id: req.params.id },
      include: {
        user: {
          select: { name: true, email: true }
        }
      }
    });

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Create project
export const createProject = async (req, res) => {
  try {
    const {
      title,
      description,
      longDescription,
      category,
      technologies,
      imageUrl,
      githubUrl,
      liveUrl,
      featured,
      status,
      startDate,
      endDate
    } = req.body;

    const project = await prisma.project.create({
      data: {
        title,
        description,
        longDescription,
        category,
        technologies,
        imageUrl,
        githubUrl,
        liveUrl,
        featured: featured || false,
        status: status || 'COMPLETED',
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        userId: req.user.id
      }
    });

    res.status(201).json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Update project
export const updateProject = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (updateData.startDate) updateData.startDate = new Date(updateData.startDate);
    if (updateData.endDate) updateData.endDate = new Date(updateData.endDate);

    const project = await prisma.project.update({
      where: { id },
      data: updateData
    });

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Admin: Delete project
export const deleteProject = async (req, res) => {
  try {
    await prisma.project.delete({
      where: { id: req.params.id }
    });

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};